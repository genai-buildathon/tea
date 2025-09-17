from typing import Optional
import asyncio
import uuid

from google.adk.sessions.base_session_service import BaseSessionService, ListSessionsResponse
from google.adk.sessions.session import Session as AdkSession


class SessionService(BaseSessionService):
    """ADK-compatible in-memory session service.

    Stores ADK Session objects keyed by session_id and filters by app/user.
    Suitable for local/testing setups.
    """

    def __init__(self):
        self._sessions: dict[str, AdkSession] = {}

    async def create_session(
        self,
        *,
        app_name: str,
        user_id: str,
        state=None,
        session_id: Optional[str] = None,
    ) -> AdkSession:
        sid = session_id or str(uuid.uuid4())
        now = asyncio.get_event_loop().time()
        sess = AdkSession(id=sid, app_name=app_name, user_id=user_id, state=state or {}, events=[], last_update_time=now)
        self._sessions[sid] = sess
        return sess

    async def get_session(self, *, app_name: str, user_id: str, session_id: str, config=None) -> AdkSession | None:
        sess = self._sessions.get(session_id)
        if not sess:
            return None
        if sess.app_name != app_name or sess.user_id != user_id:
            return None
        return sess

    async def list_sessions(self, *, app_name: str, user_id: str) -> ListSessionsResponse:
        items = [s for s in self._sessions.values() if s.app_name == app_name and s.user_id == user_id]
        return ListSessionsResponse(sessions=items)

    async def delete_session(self, *, app_name: str, user_id: str, session_id: str) -> None:
        self._sessions.pop(session_id, None)

    async def ensure_session(self, *, app_name: str, user_id: str) -> AdkSession:
        """Return an existing session for (app_name,user_id) or create a new one.

        This helps when multiple routes/agents want to share the same history.
        """
        existing = [s for s in self._sessions.values() if s.app_name == app_name and s.user_id == user_id]
        if existing:
            # return the most recently updated session
            existing.sort(key=lambda s: s.last_update_time or 0, reverse=True)
            return existing[0]
        return await self.create_session(app_name=app_name, user_id=user_id)
