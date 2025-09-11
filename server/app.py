from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
import base64
import asyncio
import logging
from typing import Dict, Optional
import uuid
import os

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
VOICE_NAME = "Puck"  # 音声名
SEND_SAMPLE_RATE = 16000  # 音声サンプルレート

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
        run_config = RunConfig(
            streaming_mode=StreamingMode.BIDI,
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config=types.PrebuiltVoiceConfig(
                        voice_name=VOICE_NAME
                    )
                )
            ),
            response_modalities=["AUDIO", "TEXT"],
            output_audio_transcription=types.AudioTranscriptionConfig(),
            input_audio_transcription=types.AudioTranscriptionConfig(),
        )
        
        # Runnerでエージェントを使用
        # fetch session created earlier
        session = None
        for s in self.session_service._sessions.values():
            if s.user_id == client_id:
                session = s
                break

        # choose mode: use Google/Vertex if configured
        has_google = bool(
            os.getenv("GOOGLE_API_KEY")
            or (os.getenv("GOOGLE_CLOUD_PROJECT") and os.getenv("GOOGLE_CLOUD_LOCATION"))
        )

        if not has_google:
            await self._send_error(
                websocket,
                "Vertex/Gemini の認証情報が未設定です。'GOOGLE_API_KEY' もしくは 'GOOGLE_CLOUD_PROJECT' と 'GOOGLE_CLOUD_LOCATION' を設定してください。",
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
                    self._handle_websocket_messages(websocket, audio_queue, video_queue),
                    name="MessageHandler"
                )

                # 音声処理・送信タスク
                tg.create_task(
                    self._process_and_send_audio(live_request_queue, audio_queue),
                    name="AudioProcessor"
                )

                # 動画処理・送信タスク
                tg.create_task(
                    self._process_and_send_video(live_request_queue, video_queue),
                    name="VideoProcessor"
                )

                # ADKレスポンス受信・処理タスク
                tg.create_task(
                    self._receive_and_process_responses(
                        runner, session, live_request_queue, run_config, websocket
                    ),
                    name="ResponseHandler",
                )
        except Exception as e:
            logger.error(f"Error in media stream processing for client {client_id}: {e}")
            await self._send_error(websocket, str(e))

    # loop continues
    
    async def _handle_websocket_messages(self, websocket: WebSocket, audio_queue: asyncio.Queue, video_queue: asyncio.Queue):
        """WebSocketメッセージ受信処理"""
        try:
            async for message in websocket.iter_text():
                try:
                    data = json.loads(message)
                    message_type = data.get("type")
                    
                    if message_type == "audio":
                        audio_bytes = base64.b64decode(data.get("data", ""))
                        await audio_queue.put(audio_bytes)
                        
                    elif message_type == "video":
                        video_bytes = base64.b64decode(data.get("data", ""))
                        video_mode = data.get("mode", "webcam")
                        await video_queue.put({
                            "data": video_bytes, 
                            "mode": video_mode,
                            "timestamp": data.get("timestamp")
                        })
                        
                        
                except json.JSONDecodeError:
                    logger.error("Invalid JSON received")
                except Exception as e:
                    logger.error(f"Error processing message: {e}")
                    
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected")
        except Exception as e:
            logger.error(f"Error in message handler: {e}")
    
    async def _process_and_send_audio(self, live_request_queue: LiveRequestQueue, audio_queue: asyncio.Queue):
        """音声データ処理・送信"""
        while True:
            try:
                data = await audio_queue.get()
                
                live_request_queue.send_realtime(
                    types.Blob(
                        data=data,
                        mime_type=f"audio/pcm;rate={SEND_SAMPLE_RATE}",
                    )
                )
                
                audio_queue.task_done()
                
            except Exception as e:
                logger.error(f"Error processing audio: {e}")
    
    async def _process_and_send_video(self, live_request_queue: LiveRequestQueue, video_queue: asyncio.Queue):
        """動画データ処理・送信"""
        while True:
            try:
                video_data_item = await video_queue.get()
                video_bytes = video_data_item.get("data")
                
                live_request_queue.send_realtime(
                    types.Blob(
                        data=video_bytes,
                        mime_type="image/jpeg",
                    )
                )
                
                video_queue.task_done()
                
            except Exception as e:
                logger.error(f"Error processing video: {e}")
    
    async def _receive_and_process_responses(
        self,
        runner: Runner,
        session: Optional[AdkSession],
        live_request_queue: LiveRequestQueue,
        run_config: RunConfig,
        websocket: WebSocket,
    ):
        """ADKからのレスポンス受信・処理"""
        try:
            async for event in runner.run_live(
                session=session,
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

# FastAPIアプリケーション初期化
app = FastAPI(title="ADK Video Analysis API")

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
