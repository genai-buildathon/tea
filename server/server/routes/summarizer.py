import asyncio
import logging
from typing import Optional

from fastapi import APIRouter, Body, HTTPException

from google.adk.agents import LiveRequestQueue
from google.adk.runners import Runner
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.genai import types

from server.app_state import server, agents

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/sessions/{session_id}/metadata", include_in_schema=False)
async def generate_metadata(session_id: str, payload: dict = Body(default={})):  # noqa: D401
    """Generate metadata using the summarizer agent over an existing session history."""
    if not server._ensure_google_config():
        raise HTTPException(status_code=500, detail="Vertex/Gemini credentials not configured")

    session = server.session_service._sessions.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    selected_agent = agents.get("summary")

    # Build a text-only run config
    run_config = RunConfig(
        streaming_mode=StreamingMode.BIDI,
        speech_config=None,
        response_modalities=[types.Modality.TEXT],
        output_audio_transcription=None,
        input_audio_transcription=None,
    )

    live_request_queue = LiveRequestQueue()
    runner = Runner(agent=selected_agent, app_name=session.app_name, session_service=server.session_service)

    # Optional hint from caller
    hint: Optional[str] = (payload.get("hint") or "").strip() if isinstance(payload, dict) else None

    # Queue a summarization prompt; agent instruction drives the format
    prompt_parts = [
        types.Part.from_text(text="これまでのセッション履歴を踏まえて、簡潔なメタデータを生成してください。"),
    ]
    if hint:
        prompt_parts.append(types.Part.from_text(text=f"補足ヒント: {hint}"))
    live_request_queue.send_content(types.Content(role="user", parts=prompt_parts))

    # Collect streamed text into a single string
    chunks: list[str] = []
    try:
        async for event in runner.run_live(
            user_id=session.user_id,
            session_id=session.id,
            live_request_queue=live_request_queue,
            run_config=run_config,
        ):
            if event.content and event.content.parts:
                for part in event.content.parts:
                    if getattr(part, "text", None):
                        chunks.append(part.text)
    except Exception as e:
        logger.error("Summarizer run failed for session %s: %s", session_id, e)
        raise HTTPException(status_code=500, detail=str(e))

    text = ("".join(chunks)).strip()
    return {"session_id": session_id, "metadata": text}
