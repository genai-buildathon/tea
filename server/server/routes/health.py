import logging
from fastapi import APIRouter

from server.app_state import server

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "active_connections": len(server.active_connections),
    }


@router.get("/sessions/{user_id}")
async def list_sessions(user_id: str):
    resp = await server.session_service.list_sessions(app_name="adk-video-app", user_id=user_id)
    return {"count": len(resp.sessions), "sessions": [s.id for s in resp.sessions]}

