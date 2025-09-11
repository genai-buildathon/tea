ChaAgentArch Backend (FastAPI + Google ADK)

Overview
- Multi‑agent backend inspired by the Google ADK + Gemini Live API article.
- Provides a WebSocket endpoint that accepts audio/video frames and streams them to an ADK agent runner (bi‑directional).
- Agent topology mirrors the shared diagram with a Planner as root and sub‑agents for Vision, Setting Analysis, Tools Identify, Basic Knowledge, Tools Analysis, Commerce, and Translation.

Key Endpoints
- `GET /health` – quick status.
- `GET /sessions/{user_id}` – list ADK sessions for debugging.
- `WS /ws/{client_id}` – send base64 messages:
  - `{type: "video", data: Base64JPEG, mode?: "webcam"|...}
  - `{type: "audio", data: Base64PCM16LE}` where sample rate is 16kHz.

Agents
- Root: `adk/agent.py` exposes `planner_agent` as `root_agent`.
- Vision: `adk/vision/agent.py` (configured for live streaming with ADK Runner).
- Others: `adk/setting/*`, `adk/tools_*/*`, `adk/translator/*`.

Local Fallback
- If Google credentials are missing, a tiny local vision mock runs so the flow still works. It returns a short Japanese summary acknowledging the frame.

Environment
- `GOOGLE_API_KEY` or (`GOOGLE_CLOUD_PROJECT` + `GOOGLE_CLOUD_LOCATION`) to enable cloud live mode.
- Optional: `ADK_AGENT_CONFIG_PATH` if you want to swap agent settings at runtime (currently unused; planner is in code).

Run
1) `python -m venv .venv && source .venv/bin/activate`
2) `pip install -r requirements.txt`
3) `python app.py`

Test
- `python test.py test-client frame.jpg`

Notes
- This is a thin, opinionated scaffold. Replace the placeholder KB/Commerce data with your DBs and wire real search as needed.
- All agents default to concise Japanese output; tailor prompts/models per your needs.
