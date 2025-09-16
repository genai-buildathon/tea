from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, FileResponse
import json
import base64
import asyncio
import logging
from typing import Dict, Optional
import uuid
import os

# Load .env early (non-fatal if missing)
try:
    from dotenv import load_dotenv, find_dotenv
    load_dotenv(find_dotenv(), override=False)
except Exception:
    pass

# ADK imports
from google.adk.agents import LiveRequestQueue
from google.adk.runners import Runner
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.genai import types

from google.adk.sessions.base_session_service import BaseSessionService, ListSessionsResponse
from google.adk.sessions.session import Session as AdkSession

from adk.agent import root_agent as agent

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 設定値
VOICE_NAME = os.getenv("VOICE_NAME", "Puck")  # 音声名
SEND_SAMPLE_RATE = int(os.getenv("SEND_SAMPLE_RATE", "16000"))  # 音声サンプルレート
ENABLE_AUDIO = os.getenv("ENABLE_AUDIO", "0") == "1"  # Live で音声入出力
AUDIO_IDLE_END_MS = int(os.getenv("AUDIO_IDLE_END_MS", "800"))  # 無音で turn 終了までの猶予

class SessionService(BaseSessionService):
    """ADK-compatible session service implementing BaseSessionService.

    Stores ADK Session objects in memory keyed by (app_name, user_id, session_id).
    This is a minimal, synchronous-in-memory implementation suitable for
    local testing and prototypes.
    """

    def __init__(self):
        # mapping session_id -> AdkSession
        self._sessions: dict[str, AdkSession] = {}

    async def create_session(self, *, app_name: str, user_id: str, state=None, session_id: str | None = None) -> AdkSession:
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


class MultimodalServer:
    """ADK統合メインサーバークラス（Agent分離版）"""
    
    def __init__(self, agent_config_path: Optional[str] = None):
        self.session_service = SessionService()
        self.active_connections: Dict[str, WebSocket] = {}
        self._last_user_content: Dict[str, types.Content] = {}
        # audio activity tracking per client
        self._audio_state: Dict[str, dict] = {}
        # per-user response mode (beginner/intermediate/advanced)
        self._user_mode: Dict[str, str] = {}

    
    def _ensure_google_config(self) -> bool:
        """Ensure we have either API key or ADC (gcloud) credentials.

        - If ADC is available, populate `GOOGLE_CLOUD_PROJECT` from ADC's
          detected project when missing, and default `GOOGLE_CLOUD_LOCATION`
          to `us-central1` if not provided.
        """
        if os.getenv("GOOGLE_API_KEY"):
            return True

        project = os.getenv("GOOGLE_CLOUD_PROJECT")
        location = os.getenv("GOOGLE_CLOUD_LOCATION")

        # Try to detect Application Default Credentials from gcloud.
        try:
            from google.auth import default as google_auth_default
            scopes = ["https://www.googleapis.com/auth/cloud-platform"]
            creds, detected_project = google_auth_default(scopes=scopes)
            if creds:
                if not project and detected_project:
                    os.environ["GOOGLE_CLOUD_PROJECT"] = detected_project
                    project = detected_project
                if not location:
                    # Reasonable default for Gemini/Vertex locations
                    os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"
                    location = "us-central1"
        except Exception:
            pass

        return bool(os.getenv("GOOGLE_API_KEY") or (project and location))

    async def connect(self, websocket: WebSocket, client_id: str):
        """WebSocket接続処理"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        # create an ADK session for this client (app_name set to server title)
        await self.session_service.create_session(app_name="adk-video-app", user_id=client_id)
        logger.info(f"Client {client_id} connected")
    
    def disconnect(self, client_id: str):
        """WebSocket切断処理"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        # We cannot await here; schedule deletion if session exists
        try:
            # best-effort: remove any sessions with matching user_id
            for sid, sess in list(self.session_service._sessions.items()):
                if sess.user_id == client_id:
                    # fire-and-forget
                    asyncio.create_task(self.session_service.delete_session(app_name=sess.app_name, user_id=sess.user_id, session_id=sid))
        except Exception:
            pass
        logger.info(f"Client {client_id} disconnected")
    
    async def process_media_stream(self, agent, websocket: WebSocket, client_id: str):
        """メディアストリーム処理のメインメソッド"""
        # 外部エージェントを取得
        agent = agent
        logger.info(f"Using agent: {agent.name}")
        
        # ADK LiveRequestQueueの初期化
        live_request_queue = LiveRequestQueue()
        
        # RunConfigの設定
        if ENABLE_AUDIO:
            run_config = RunConfig(
                streaming_mode=StreamingMode.BIDI,
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE_NAME)
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
            # TEXT only (開発用)
            run_config = RunConfig(
                streaming_mode=StreamingMode.BIDI,
                speech_config=None,
                response_modalities=[types.Modality.TEXT],
                output_audio_transcription=None,
                input_audio_transcription=None,
            )
        
        # Runnerでエージェントを使用
        # fetch session created earlier
        session = None
        for s in self.session_service._sessions.values():
            if s.user_id == client_id:
                session = s
                break

        # Ensure Vertex/Gemini config: API key or ADC via gcloud.
        if not self._ensure_google_config():
            await self._send_error(
                websocket,
                "Vertex/Gemini の認証情報が未設定です。`gcloud auth application-default login` 実行後、必要なら `GOOGLE_CLOUD_PROJECT` と `GOOGLE_CLOUD_LOCATION`(例: us-central1) を設定してください。",
            )
            return

        runner = Runner(agent=agent, app_name="adk-video-app", session_service=self.session_service)
        
        # 非同期キューの初期化
        audio_queue = asyncio.Queue()
        video_queue = asyncio.Queue()
        
        try:
            async with asyncio.TaskGroup() as tg:
                # WebSocketメッセージ受信タスク
                tg.create_task(
                    self._handle_websocket_messages(websocket, audio_queue, video_queue, live_request_queue, client_id),
                    name="MessageHandler"
                )

                # 音声処理・送信タスク
                tg.create_task(
                    self._process_and_send_audio(live_request_queue, audio_queue, client_id),
                    name="AudioProcessor"
                )

                # 動画処理・送信タスク
                tg.create_task(
                    self._process_and_send_video(live_request_queue, video_queue, client_id),
                    name="VideoProcessor"
                )

                # ADKレスポンス受信・処理タスク
                tg.create_task(
                    self._receive_and_process_responses(
                        runner, session, live_request_queue, run_config, websocket, client_id
                    ),
                    name="ResponseHandler",
                )
        except Exception as e:
            logger.error(f"Error in media stream processing for client {client_id}: {e}")
            await self._send_error(websocket, str(e))

    # loop continues
    
    async def _handle_websocket_messages(self, websocket: WebSocket, audio_queue: asyncio.Queue, video_queue: asyncio.Queue, live_request_queue: LiveRequestQueue, client_id: str):
        """WebSocketメッセージ受信処理"""
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
                        video_mode = data.get("mode", "webcam")
                        await video_queue.put({
                            "data": video_bytes, 
                            "mode": video_mode,
                            "timestamp": data.get("timestamp")
                        })
                        logger.info("Enqueued video frame: %d bytes (mode=%s)", len(video_bytes) if video_bytes else 0, video_mode)

                    elif message_type == "mode":
                        # Set per-user response mode
                        raw = (data.get("data") or data.get("value") or "").strip().lower()
                        # Allow Japanese aliases
                        aliases = {
                            "初級": "beginner",
                            "中級": "intermediate",
                            "上級": "advanced",
                        }
                        normalized = aliases.get(raw, raw)
                        if normalized in ("beginner", "intermediate", "advanced"):
                            self._user_mode[client_id] = normalized
                            logger.info("Set mode for %s -> %s", client_id, normalized)
                        else:
                            logger.warning("Unknown mode '%s' from client %s", raw, client_id)

                    elif message_type == "text":
                        text = data.get("data", "")
                        if text:
                            parts = [
                                types.Part.from_text(text=self._mode_instruction(client_id)),
                                types.Part.from_text(text=text),
                            ]
                            content = types.Content(role="user", parts=parts)
                            live_request_queue.send_content(content)
                            # Save last user content for re-injection after agent transfer
                            self._last_user_content[client_id] = content
                            logger.info("Queued user text turn (%d chars)", len(text))
                        else:
                            logger.warning("Received empty text payload")
                        
                        
                except json.JSONDecodeError:
                    logger.error("Invalid JSON received")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected")
        except Exception as e:
            logger.error(f"Error in message handler: {e}")
    
    async def _process_and_send_audio(self, live_request_queue: LiveRequestQueue, audio_queue: asyncio.Queue, client_id: str):
        """音声データ処理・送信"""
        while True:
            try:
                data = await audio_queue.get()
                # Start-of-activity when first chunk after idle (ENABLE_AUDIO 時のみ採用)
                if ENABLE_AUDIO:
                    st = self._audio_state.setdefault(client_id, {"open": False, "last": 0.0})
                    now = asyncio.get_event_loop().time()
                    if not st["open"]:
                        live_request_queue.send_activity_start()
                        st["open"] = True
                    st["last"] = now
                    # schedule turn end after idle
                    asyncio.create_task(self._schedule_audio_activity_end(live_request_queue, client_id))

                live_request_queue.send_realtime(
                    types.Blob(
                        data=data,
                        mime_type=f"audio/pcm;rate={SEND_SAMPLE_RATE}",
                    )
                )
                
                audio_queue.task_done()
                
            except Exception as e:
                logger.error(f"Error processing audio: {e}")

    async def _schedule_audio_activity_end(self, live_request_queue: LiveRequestQueue, client_id: str):
        await asyncio.sleep(AUDIO_IDLE_END_MS / 1000)
        st = self._audio_state.get(client_id)
        if not st:
            return
        now = asyncio.get_event_loop().time()
        # if no audio since scheduled
        if st["open"] and now - st["last"] >= (AUDIO_IDLE_END_MS / 1000) - 0.05:
            live_request_queue.send_activity_end()
            st["open"] = False
    
    async def _process_and_send_video(self, live_request_queue: LiveRequestQueue, video_queue: asyncio.Queue, client_id: str):
        """動画データ処理・送信"""
        while True:
            try:
                video_data_item = await video_queue.get()
                video_bytes = video_data_item.get("data")
                # Prefer a discrete user turn with the image to trigger a response
                # reliably, rather than relying on realtime VAD.
                # Place text first so history filter can pick it up if needed
                parts = [
                    types.Part.from_text(text=self._mode_instruction(client_id)),
                    types.Part.from_text(text="この画像の内容を短く説明してください。道具があれば特定して。"),
                    types.Part.from_bytes(data=video_bytes, mime_type="image/jpeg"),
                ]
                content = types.Content(role="user", parts=parts)
                live_request_queue.send_content(content)
                # Save last user content to replay after agent transfer
                self._last_user_content[client_id] = content
                logger.info("Queued image content turn to Live API (%d bytes)", len(video_bytes) if video_bytes else 0)
                # Also send a small follow-up text nudge after short delay to help trigger a response
                await asyncio.sleep(0.3)
                live_request_queue.send_content(
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_text(text=self._mode_instruction(client_id)),
                            types.Part.from_text(text="上の画像について返答してください。"),
                        ],
                    )
                )
                
                video_queue.task_done()
                
            except Exception as e:
                logger.error(f"Error processing video: {e}")

    def _get_mode(self, client_id: str) -> str:
        """Get current response mode for the client (default: intermediate)."""
        return self._user_mode.get(client_id, "intermediate")

    def _mode_instruction(self, client_id: str) -> str:
        """Return a concise style instruction based on the user's mode."""
        mode = self._get_mode(client_id)
        if mode == "beginner":
            return (
                "初級者モード: 優しい語り口で、専門用語を避け、短く、具体例を交えて説明してください。必要なら最後に理解確認の質問を1つ添えてください。"
            )
        if mode == "advanced":
            return (
                "上級者モード: 簡潔かつ技術的に、前提説明は省略して要点・注意点・限界を短く挙げてください。"
            )
        # default: intermediate
        return (
            "中級者モード: 要点を箇条書き中心で、必要十分な専門用語のみ使い、手順や根拠を簡潔に示してください。"
        )
    
    async def _receive_and_process_responses(
        self,
        runner: Runner,
        session: Optional[AdkSession],
        live_request_queue: LiveRequestQueue,
        run_config: RunConfig,
        websocket: WebSocket,
        client_id: str,
    ):
        """ADKからのレスポンス受信・処理"""
        try:
            async for event in runner.run_live(
                user_id=client_id,
                session_id=session.id if session else None,
                live_request_queue=live_request_queue,
                run_config=run_config,
            ):
                if event.content and event.content.parts:
                    for part in event.content.parts:
                        # Audio parts are kept as JSON with a type, since
                        # the payload is base64-encoded binary.
                        if hasattr(part, "inline_data") and part.inline_data and part.inline_data.data:
                            b64_audio = base64.b64encode(part.inline_data.data).decode("utf-8")
                            await websocket.send_text(json.dumps({
                                "type": "audio",
                                "data": b64_audio
                            }))

                        # Text parts are sent as plain string frames.
                        if hasattr(part, "text") and part.text:
                            await websocket.send_text(part.text)
                        # If model triggered agent transfer, schedule robust replays
                        if getattr(part, "function_response", None) and getattr(part.function_response, "name", "") == "transfer_to_agent":
                            content = self._last_user_content.get(client_id)
                            if content is not None:
                                asyncio.create_task(self._schedule_replay_after_transfer(live_request_queue, content))
                            
        except Exception as e:
            logger.error(f"Error in response handler: {e}")
            await self._send_error(websocket, str(e))
    
    async def _send_error(self, websocket: WebSocket, error_message: str):
        """エラーメッセージ送信"""
        try:
            # Send error as a plain string frame for simpler clients.
            await websocket.send_text(error_message)
        except Exception:
            pass

    async def _schedule_replay_after_transfer(self, live_request_queue: LiveRequestQueue, content: types.Content):
        """After an agent transfer, Live reconnects; replay input a few times.

        We send the image (if any) as realtime blob, then a short text prompt.
        We attempt a few times with delays so at least one lands after the
        reconnection completes.
        """
        delays = [0.8, 1.6, 2.4]
        for idx, d in enumerate(delays, start=1):
            await asyncio.sleep(d)
            try:
                # resend image as realtime blob if present
                sent_blob = False
                if content.parts:
                    for p in content.parts:
                        if getattr(p, 'inline_data', None) and getattr(p.inline_data, 'data', None):
                            live_request_queue.send_realtime(
                                types.Blob(data=p.inline_data.data, mime_type=p.inline_data.mime_type or 'image/jpeg')
                            )
                            sent_blob = True
                            break
                # send a concise text turn
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

# FastAPIアプリケーション初期化
app = FastAPI(title="ADK Video Analysis API", docs_url=None, redoc_url=None, openapi_url=None)

# エージェント設定パスを環境変数から取得
agent_config_path = os.getenv("ADK_AGENT_CONFIG_PATH")
server = MultimodalServer(agent_config_path)


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocketエンドポイント"""
    await server.connect(websocket, client_id)
    
    try:
        await server.process_media_stream(agent, websocket, client_id)
    except WebSocketDisconnect:
        server.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for client {client_id}: {e}")
        server.disconnect(client_id)


@app.get("/health")
async def health_check():
    """ヘルスチェック"""
    return {
        "status": "healthy", 
        "active_connections": len(server.active_connections),
    }


@app.get("/sessions/{user_id}")
async def list_sessions(user_id: str):
    """List sessions for a user (debug aid)."""
    resp = await server.session_service.list_sessions(app_name="adk-video-app", user_id=user_id)
    return {"count": len(resp.sessions), "sessions": [s.id for s in resp.sessions]}


@app.get("/openapi.yaml", include_in_schema=False)
async def serve_openapi_yaml():
    """Serve the repository's OpenAPI YAML spec file."""
    spec_path = os.path.join(os.path.dirname(__file__), "openapi.yaml")
    return FileResponse(spec_path, media_type="application/yaml")


@app.get("/docs", include_in_schema=False)
async def swagger_ui():
    """Swagger UI that points to /openapi.yaml."""
    html = """
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Swagger UI</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
        <script>
          window.ui = SwaggerUIBundle({
            url: '/openapi.yaml',
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis],
          });
        </script>
      </body>
    </html>
    """
    return HTMLResponse(content=html)


@app.get("/redoc", include_in_schema=False)
async def redoc_ui():
    """ReDoc that points to /openapi.yaml."""
    html = """
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>ReDoc</title>
        <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
      </head>
      <body>
        <redoc spec-url="/openapi.yaml"></redoc>
      </body>
    </html>
    """
    return HTMLResponse(content=html)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
