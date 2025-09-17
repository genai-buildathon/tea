import asyncio
import base64
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from google.genai import types

from google.adk.agents import LiveRequestQueue
from google.adk.runners import Runner

from server.app_state import server, agents

logger = logging.getLogger(__name__)


router = APIRouter()


@router.websocket("/ws/{agent_key}/{connection_id}")
async def websocket_endpoint_with_agent(websocket: WebSocket, agent_key: str, connection_id: str):
    # Require that connection is created beforehand via REST and agent matches
    meta = server.connection_index.get(connection_id)
    if not meta:
        await websocket.accept()
        await websocket.send_text("Unknown connection_id. Create stream first.")
        await websocket.close()
        return
    if meta.get("agent_key") != agent_key:
        await websocket.accept()
        await websocket.send_text("agent_key mismatch for this connection_id")
        await websocket.close()
        return

    selected = agents.get(agent_key)
    await server.connect(websocket, connection_id)
    try:
        await server.process_media_stream(selected, websocket, connection_id)
    except WebSocketDisconnect:
        server.disconnect(connection_id)
    except Exception as e:
        logger.error("WebSocket error for conn %s (agent=%s): %s", connection_id, agent_key, e)
        server.disconnect(connection_id)
