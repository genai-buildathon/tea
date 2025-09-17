import logging
from typing import Optional

from fastapi import APIRouter, Body, HTTPException

from server.app_state import server, agents

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/connections/{agent_key}")
async def create_stream_connection(agent_key: str, payload: dict = Body(...)):
    if agent_key not in agents:
        raise HTTPException(status_code=404, detail="Unknown agent_key")
    user_id: Optional[str] = (payload.get("user_id") or "").strip() if isinstance(payload, dict) else None
    session_id: Optional[str] = (payload.get("session_id") or "").strip() if isinstance(payload, dict) else None
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    try:
        conn = await server.create_connection(agent_key=agent_key, user_id=user_id, session_id=session_id or None)
        return conn
    except Exception as e:
        logger.error("Failed creating connection: %s", e)
        raise HTTPException(status_code=500, detail=str(e))

