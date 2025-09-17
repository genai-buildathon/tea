import asyncio
import base64
import logging
import os
import json
from typing import Dict, Optional
from contextlib import asynccontextmanager

from fastapi import WebSocket

from google.adk.agents import LiveRequestQueue
from google.adk.runners import Runner
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.genai import types

from ..config import settings
from ..services.sessions import SessionService

logger = logging.getLogger(__name__)


class MultimodalServer:
    """ADK-integrated main server handling WS/SSE orchestration.

    Extracted from app.py to keep routing slim.
    """

    def __init__(self):
        self.session_service = SessionService()
        # Live websockets keyed by connection_id
        self.active_connections: Dict[str, WebSocket] = {}
        # connection_id -> {user_id, agent_key, session_id}
        self.connection_index: Dict[str, dict] = {}
        self._last_user_content: Dict[str, types.Content] = {}
        self._audio_state: Dict[str, dict] = {}
        self._user_mode: Dict[str, str] = {}
        # For SSE users, a simple per-client state bucket (created by app routes)
        self._sse_clients: Dict[str, dict] = {}
        # Global limiter for concurrent live sessions to avoid RESOURCE_EXHAUSTED
        self._live_slots = asyncio.Semaphore(settings.LIVE_SESSIONS_MAX)
        self._live_in_use = 0

    @asynccontextmanager
    async def live_session_slot(self):
        await self._live_slots.acquire()
        self._live_in_use += 1
        logger.info("[live] acquired slot (%d/%d)", self._live_in_use, settings.LIVE_SESSIONS_MAX)
        try:
            yield
        finally:
            self._live_slots.release()
            self._live_in_use = max(0, self._live_in_use - 1)
            logger.info("[live] released slot (%d/%d)", self._live_in_use, settings.LIVE_SESSIONS_MAX)

    async def process_media_stream(self, agent, websocket: WebSocket, connection_id: str):
        """End-to-end WS media stream orchestration (mirrors previous app.py)."""
        meta = self.connection_index.get(connection_id)
        if not meta:
            await websocket.send_text("Unknown connection_id. Create a stream first.")
            return
        user_id = meta.get("user_id")
        session_id = meta.get("session_id")
        logger.info("Using agent: %s (conn=%s user=%s sess=%s)", getattr(agent, "name", "<unknown>"), connection_id, user_id, session_id)
        live_request_queue = LiveRequestQueue()
        run_config = self.build_run_config()

        # fetch session created earlier (create_connection should have been called)
        session = self.session_service._sessions.get(session_id) if session_id else None

        if not self._ensure_google_config():
            try:
                await websocket.send_text(
                    "Vertex/Gemini の認証情報が未設定です。`gcloud auth application-default login` 実行後、必要なら `GOOGLE_CLOUD_PROJECT` と `GOOGLE_CLOUD_LOCATION`(例: us-central1) を設定してください。"
                )
            finally:
                return

        runner = Runner(agent=agent, app_name="adk-video-app", session_service=self.session_service)

        audio_queue: asyncio.Queue = asyncio.Queue()
        video_queue: asyncio.Queue = asyncio.Queue()

        async def _handle_websocket_messages():
            try:
                async for message in websocket.iter_text():
                    try:
                        data = json.loads(message)
                        message_type = data.get("type")
                        if message_type == "audio":
                            audio_bytes = base64.b64decode(data.get("data", ""))
                            await audio_queue.put(audio_bytes)
                            logger.info("Enqueued audio chunk: %d bytes", len(audio_bytes) if audio_bytes else 0)
                        elif message_type == "video":
                            video_bytes = base64.b64decode(data.get("data", ""))
                            await video_queue.put({"data": video_bytes, "mode": data.get("mode", "webcam"), "timestamp": data.get("timestamp")})
                            logger.info("Enqueued video frame: %d bytes", len(video_bytes) if video_bytes else 0)
                        elif message_type == "mode":
                            raw = (data.get("data") or data.get("value") or "").strip().lower()
                            aliases = {"初級": "beginner", "中級": "intermediate", "上級": "advanced"}
                            normalized = aliases.get(raw, raw)
                            if normalized in ("beginner", "intermediate", "advanced"):
                                self._user_mode[connection_id] = normalized
                                logger.info("Set mode for %s -> %s", connection_id, normalized)
                        elif message_type == "text":
                            text = (data.get("data") or "").strip()
                            if text:
                                parts = [
                                    types.Part.from_text(text=self._mode_instruction(connection_id)),
                                    types.Part.from_text(text=text),
                                ]
                                content = types.Content(role="user", parts=parts)
                                live_request_queue.send_content(content)
                                self._last_user_content[connection_id] = content
                                logger.info("Queued user text turn (%d chars)", len(text))
                    except Exception:
                        logger.exception("WS message handling error")
            except Exception:
                logger.info("WebSocket disconnected")

        class _WebSocketSink:
            def __init__(self, ws: WebSocket):
                self.ws = ws
            async def send_text(self, data: str):
                await self.ws.send_text(data)

        # Run tasks explicitly so we can cancel cleanly on disconnect
        ws_task = asyncio.create_task(_handle_websocket_messages(), name=f"ws-messages:{connection_id}")
        audio_task = asyncio.create_task(self._process_and_send_audio(live_request_queue, audio_queue, connection_id), name=f"audio-proc:{connection_id}")
        video_task = asyncio.create_task(self._process_and_send_video(live_request_queue, video_queue, connection_id), name=f"video-proc:{connection_id}")
        resp_task = asyncio.create_task(self._receive_and_process_responses(runner, session, live_request_queue, run_config, _WebSocketSink(websocket), connection_id), name=f"resp-handler:{connection_id}")

        try:
            # Wait until either the websocket ends or the response handler ends
            done, pending = await asyncio.wait({ws_task, resp_task}, return_when=asyncio.FIRST_COMPLETED)
        except Exception as e:
            logger.error("Error in media stream processing for conn %s: %s", connection_id, e)
            try:
                await websocket.send_text(str(e))
            except Exception:
                pass
        finally:
            for t in (ws_task, audio_task, video_task, resp_task):
                if not t.done():
                    t.cancel()
            await asyncio.gather(ws_task, audio_task, video_task, resp_task, return_exceptions=True)
            # Ensure we drop the connection reference
            self.disconnect(connection_id)

    def build_run_config(self) -> RunConfig:
        if settings.ENABLE_AUDIO:
            return RunConfig(
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
        return RunConfig(
            streaming_mode=StreamingMode.BIDI,
            speech_config=None,
            response_modalities=[types.Modality.TEXT],
            output_audio_transcription=None,
            input_audio_transcription=None,
        )

    def _ensure_google_config(self) -> bool:
        if os.getenv("GOOGLE_API_KEY"):
            return True
        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION")
        try:
            from google.auth import default as google_auth_default
            scopes = ["https://www.googleapis.com/auth/cloud-platform"]
            creds, detected_project = google_auth_default(scopes=scopes)
            if creds:
                if not project and detected_project:
                    os.environ["GOOGLE_CLOUD_PROJECT"] = detected_project
                    project = detected_project
                if not location:
                    os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"
                    location = "us-central1"
        except Exception:
            pass
        return bool(os.getenv("GOOGLE_API_KEY") or (project and location))

    async def connect(self, websocket: WebSocket, connection_id: str):
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        logger.info("Connection %s connected", connection_id)

    def disconnect(self, connection_id: str):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        logger.info("Connection %s disconnected", connection_id)

    async def create_connection(self, *, agent_key: str, user_id: str, session_id: Optional[str] = None) -> dict:
        import uuid
        # Ensure session
        if session_id:
            sess = await self.session_service.get_session(app_name="adk-video-app", user_id=user_id, session_id=session_id)
            if not sess:
                sess = await self.session_service.create_session(app_name="adk-video-app", user_id=user_id, session_id=session_id)
        else:
            sess = await self.session_service.ensure_session(app_name="adk-video-app", user_id=user_id)
        connection_id = str(uuid.uuid4())
        self.connection_index[connection_id] = {
            "user_id": user_id,
            "agent_key": agent_key,
            "session_id": sess.id,
        }
        return {"connection_id": connection_id, "user_id": user_id, "session_id": sess.id, "agent_key": agent_key}

    async def _process_and_send_audio(self, live_request_queue: LiveRequestQueue, audio_queue: asyncio.Queue, connection_id: str):
        while True:
            try:
                data = await audio_queue.get()
                if settings.ENABLE_AUDIO:
                    st = self._audio_state.setdefault(connection_id, {"open": False, "last": 0.0})
                    now = asyncio.get_event_loop().time()
                    if not st["open"]:
                        live_request_queue.send_activity_start()
                        st["open"] = True
                    st["last"] = now
                    asyncio.create_task(self._schedule_audio_activity_end(live_request_queue, connection_id))

                live_request_queue.send_realtime(
                    types.Blob(
                        data=data,
                        mime_type=f"audio/pcm;rate={settings.SEND_SAMPLE_RATE}",
                    )
                )
                audio_queue.task_done()
            except Exception as e:
                logger.error("Error processing audio: %s", e)

    async def _schedule_audio_activity_end(self, live_request_queue: LiveRequestQueue, connection_id: str):
        await asyncio.sleep(settings.AUDIO_IDLE_END_MS / 1000)
        st = self._audio_state.get(connection_id)
        if not st:
            return
        now = asyncio.get_event_loop().time()
        if st["open"] and now - st["last"] >= (settings.AUDIO_IDLE_END_MS / 1000) - 0.05:
            live_request_queue.send_activity_end()
            st["open"] = False

    async def _send_video_content_immediate(self, live_request_queue: LiveRequestQueue, connection_id: str, video_bytes: bytes):
        try:
            parts = [
                types.Part.from_text(text=self._mode_instruction(connection_id)),
                types.Part.from_text(text="この画像の内容を短く説明してください。道具があれば特定して。"),
                types.Part.from_bytes(data=video_bytes, mime_type="image/jpeg"),
            ]
            content = types.Content(role="user", parts=parts)
            live_request_queue.send_content(content)
            self._last_user_content[connection_id] = content
            logger.info("Queued image content turn to Live API (%d bytes)", len(video_bytes) if video_bytes else 0)
            await asyncio.sleep(0.3)
            live_request_queue.send_content(
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text=self._mode_instruction(connection_id)),
                        types.Part.from_text(text="上の画像について返答してください。"),
                    ],
                )
            )
        except Exception as e:
            logger.error("Immediate video content send failed: %s", e)

    async def _process_and_send_video(self, live_request_queue: LiveRequestQueue, video_queue: asyncio.Queue, connection_id: str):
        """Pull frames from queue and send as a user turn with instruction.

        Shared by WS and SSE paths. This mirrors the app.py behavior but
        delegates to the immediate-sender helper.
        """
        while True:
            try:
                item = await video_queue.get()
                video_bytes = item.get("data") if isinstance(item, dict) else item
                await self._send_video_content_immediate(live_request_queue, connection_id, video_bytes)
                video_queue.task_done()
            except Exception as e:
                logger.error("Error processing video: %s", e)

    async def _receive_and_process_responses(self, runner: Runner, session, live_request_queue: LiveRequestQueue, run_config: RunConfig, sink, connection_id: str):
        try:
            async with self.live_session_slot():
                async for event in runner.run_live(
                    user_id=self.connection_index.get(connection_id, {}).get("user_id"),
                    session_id=session.id if session else None,
                    live_request_queue=live_request_queue,
                    run_config=run_config,
                ):
                    if event.content and event.content.parts:
                        for part in event.content.parts:
                            if hasattr(part, "inline_data") and part.inline_data and part.inline_data.data:
                                b64_audio = base64.b64encode(part.inline_data.data).decode("utf-8")
                                msg = json.dumps({"type": "audio", "data": b64_audio}, separators=(",", ":"))
                                await sink.send_text(msg)
                            if hasattr(part, "text") and part.text:
                                await sink.send_text(part.text)
                            if getattr(part, "function_response", None) and getattr(part.function_response, "name", "") == "transfer_to_agent":
                                content = self._last_user_content.get(connection_id)
                                if content is not None:
                                    asyncio.create_task(self._schedule_replay_after_transfer(live_request_queue, content))
        except Exception as e:
            try:
                await sink.send_text(str(e))
            except Exception:
                pass
            logger.error("Error in response handler: %s", e)

    async def _schedule_replay_after_transfer(self, live_request_queue: LiveRequestQueue, content: types.Content):
        delays = [0.8, 1.6, 2.4]
        for idx, d in enumerate(delays, start=1):
            await asyncio.sleep(d)
            try:
                sent_blob = False
                if content.parts:
                    for p in content.parts:
                        if getattr(p, 'inline_data', None) and getattr(p.inline_data, 'data', None):
                            live_request_queue.send_realtime(
                                types.Blob(data=p.inline_data.data, mime_type=p.inline_data.mime_type or 'image/jpeg')
                            )
                            sent_blob = True
                            break
                prompt = None
                if content.parts:
                    for p in content.parts:
                        if getattr(p, 'text', None):
                            prompt = p.text
                            break
                if not prompt:
                    prompt = "この入力を解析して要約してください。"
                live_request_queue.send_content(
                    types.Content(role="user", parts=[types.Part.from_text(text=prompt)])
                )
                logger.info("Replayed user input attempt %d after transfer (blob=%s)", idx, sent_blob)
            except Exception as e:
                logger.error("Replay after transfer failed: %s", e)

    def _get_mode(self, connection_id: str) -> str:
        return self._user_mode.get(connection_id, "intermediate")

    def _mode_instruction(self, connection_id: str) -> str:
        mode = self._get_mode(connection_id)
        if mode == "beginner":
            return (
                "初級者モード: 優しい語り口で、専門用語を避け、短く、具体例を交えて説明してください。必要なら最後に理解確認の質問を1つ添えてください。"
            )
        if mode == "advanced":
            return (
                "上級者モード: 簡潔かつ技術的に、前提説明は省略して要点・注意点・限界を短く挙げてください。"
            )
        return (
            "中級者モード: 要点を箇条書き中心で、必要十分な専門用語のみ使い、手順や根拠を簡潔に示してください。"
        )

    class SseSink:
        def __init__(self, queue: asyncio.Queue):
            self.queue = queue

        async def send_text(self, data: str):
            await self.queue.put(data)
