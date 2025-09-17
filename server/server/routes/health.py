import logging
from fastapi import APIRouter

from server.app_state import server

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check():
    from server.config import settings
    return {
        "status": "healthy",
        "active_connections": len(server.active_connections),
        "live_in_use": getattr(server, "_live_in_use", 0),
        "live_max": getattr(settings, "LIVE_SESSIONS_MAX", None),
    }


@router.get("/sessions/{user_id}")
async def list_sessions(user_id: str):
    resp = await server.session_service.list_sessions(app_name="adk-video-app", user_id=user_id)
    return {"count": len(resp.sessions), "sessions": [s.id for s in resp.sessions]}
