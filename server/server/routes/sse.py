import asyncio
import base64
import logging

from fastapi import APIRouter, Body, HTTPException
from starlette.responses import StreamingResponse

from google.adk.agents import LiveRequestQueue
from google.adk.runners import Runner
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.genai import types

from server.app_state import server, agents
from server.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/sse/{agent_key}/{connection_id}", include_in_schema=False)
async def sse_stream_with_agent(agent_key: str, connection_id: str):
    if not server._ensure_google_config():
        raise HTTPException(status_code=500, detail="Vertex/Gemini credentials not configured")

    meta = server.connection_index.get(connection_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Unknown connection_id. Create stream first")
    if meta.get("agent_key") != agent_key:
        raise HTTPException(status_code=400, detail="agent_key mismatch for this connection_id")

    state_key = connection_id
    if state_key not in server._sse_clients:
        # Ensure the mapped session exists
        session = server.session_service._sessions.get(meta.get("session_id"))
        if not session:
            try:
                _ = await server.session_service.ensure_session(app_name="adk-video-app", user_id=meta.get("user_id"))
            except Exception:
                await server.session_service.create_session(app_name="adk-video-app", user_id=meta.get("user_id"))

        audio_queue: asyncio.Queue = asyncio.Queue()
        video_queue: asyncio.Queue = asyncio.Queue()
        outbound_queue: asyncio.Queue = asyncio.Queue()

        live_request_queue = LiveRequestQueue()

        if settings.ENABLE_AUDIO:
            run_config = RunConfig(
                streaming_mode=StreamingMode.BIDI,
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=settings.VOICE_NAME)
                    )
                ),
                response_modalities=[types.Modality.AUDIO, types.Modality.TEXT],
                output_audio_transcription=types.AudioTranscriptionConfig(),
                input_audio_transcription=types.AudioTranscriptionConfig(),
                realtime_input_config=types.RealtimeInputConfig(
                    automatic_activity_detection=types.AutomaticActivityDetection(
                        start_of_speech_sensitivity=types.StartSensitivity.START_SENSITIVITY_HIGH,
                        end_of_speech_sensitivity=types.EndSensitivity.END_SENSITIVITY_HIGH,
                    )
                ),
            )
        else:
            run_config = RunConfig(
                streaming_mode=StreamingMode.BIDI,
                speech_config=None,
                response_modalities=[types.Modality.TEXT],
                output_audio_transcription=None,
                input_audio_transcription=None,
            )

        session = server.session_service._sessions.get(meta.get("session_id"))

        selected_agent = agents.get(agent_key)
        runner = Runner(agent=selected_agent, app_name="adk-video-app", session_service=server.session_service)

        sse_sink = server.SseSink(outbound_queue)
        audio_task = asyncio.create_task(server._process_and_send_audio(live_request_queue, audio_queue, client_id))
        video_task = asyncio.create_task(server._process_and_send_video(live_request_queue, video_queue, client_id))
        resp_task = asyncio.create_task(
            server._receive_and_process_responses(
                runner, session, live_request_queue, run_config, sse_sink, client_id
            )
        )
        server._sse_clients[state_key] = {
            "audio_queue": audio_queue,
            "video_queue": video_queue,
            "outbound_queue": outbound_queue,
            "live_request_queue": live_request_queue,
            "tasks": [audio_task, video_task, resp_task],
        }

    state = server._sse_clients[state_key]

    async def event_generator():
        try:
            yield "event: ready\ndata: ok\n\n"
            while True:
                try:
                    data = await asyncio.wait_for(state["outbound_queue"].get(), timeout=5.0)
                    yield f"data: {data}\n\n"
                except asyncio.TimeoutError:
                    yield "event: ping\ndata: keepalive\n\n"
        except asyncio.CancelledError:
            pass
        finally:
            tasks = state.get("tasks", [])
            for t in tasks:
                t.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
            server._sse_clients.pop(state_key, None)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/sse/{agent_key}/{connection_id}/text", include_in_schema=False)
async def sse_send_text_with_agent(agent_key: str, connection_id: str, payload: dict = Body(...)):
    state = server._sse_clients.get(connection_id)
    if not state:
        raise HTTPException(status_code=404, detail="SSE client not connected")
    text = (payload.get("data") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Missing text data")
    parts = [
        types.Part.from_text(text=server._mode_instruction(connection_id)),
        types.Part.from_text(text=text),
    ]
    content = types.Content(role="user", parts=parts)
    state["live_request_queue"].send_content(content)
    server._last_user_content[connection_id] = content
    return {"ok": True}


@router.post("/sse/{agent_key}/{connection_id}/video", include_in_schema=False)
async def sse_send_video_with_agent(agent_key: str, connection_id: str, payload: dict = Body(...)):
    state = server._sse_clients.get(connection_id)
    if not state:
        raise HTTPException(status_code=404, detail="SSE client not connected")
    b64 = payload.get("data")
    if not b64:
        raise HTTPException(status_code=400, detail="Missing video data (base64)")
    try:
        video_bytes = base64.b64decode(b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 for video")
    await server._send_video_content_immediate(state["live_request_queue"], connection_id, video_bytes)
    return {"ok": True}


@router.post("/sse/{agent_key}/{connection_id}/audio", include_in_schema=False)
async def sse_send_audio_with_agent(agent_key: str, connection_id: str, payload: dict = Body(...)):
    state = server._sse_clients.get(connection_id)
    if not state:
        raise HTTPException(status_code=404, detail="SSE client not connected")
    b64 = payload.get("data")
    if not b64:
        raise HTTPException(status_code=400, detail="Missing audio data (base64)")
    try:
        audio_bytes = base64.b64decode(b64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 for audio")
    await state["audio_queue"].put(audio_bytes)
    return {"ok": True}


@router.post("/sse/{agent_key}/{connection_id}/mode", include_in_schema=False)
async def sse_set_mode_with_agent(agent_key: str, connection_id: str, payload: dict = Body(...)):
    raw = (payload.get("data") or payload.get("value") or "").strip().lower()
    aliases = {"初級": "beginner", "中級": "intermediate", "上級": "advanced"}
    normalized = aliases.get(raw, raw)
    if normalized not in ("beginner", "intermediate", "advanced"):
        raise HTTPException(status_code=400, detail="Unknown mode value")
    server._user_mode[connection_id] = normalized
    return {"ok": True, "mode": normalized}
