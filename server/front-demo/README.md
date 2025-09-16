# Front Demo (Next.js)

Minimal local UI to verify your server via WebSocket and SSE.

- Backend: `https://tea-server-760751063280.us-central1.run.app`
- Proxied HTTP/SSE paths: `/api/*` → backend (via `next.config.js` rewrites)
- WebSocket: connects directly to `wss://.../ws/{agent}/{connection_id}`

## Quick start

1. Install deps

   ```bash
   cd front-demo
   npm i
   ```

2. Run dev

   ```bash
   npm run dev
   # open http://localhost:3000
   ```

## How to use

1. Create a connection
   - Choose `agent_key` (analyze|summary)
   - Enter a `user_id` (any string is fine)
   - Optionally set an existing `session_id`
   - Click "Create Connection"

2. Test WebSocket
   - Go to the WebSocket tab, click "Connect WS"
   - Click "Start Camera" → "Start Stream" to send webcam frames over WS (configurable FPS/JPEG quality)
   - Send text or set mode
   - Optionally send a single JPEG via file upload

3. Test SSE
   - Go to the SSE tab, click "Open SSE"
   - Click "Start Camera" → "Send Frame" to push the current webcam frame once via HTTP
   - Send text or set mode (POST via proxy)
   - Optionally send a JPEG via file upload

4. Generate Metadata
   - After a connection is created, use the "メタデータ生成" section
   - Optionally add a hint, click Generate → shows metadata from `/sessions/{session_id}/metadata`

### Notes

- HTTP/SSE go through `/api/*` so the browser avoids CORS. If your backend URL changes, set `BACKEND_BASE` when starting Next:

  ```bash
  BACKEND_BASE="https://your-backend" npm run dev
  ```

- WebSocket is allowed cross-origin in browsers, so it connects directly to `wss://.../ws/...`.
- Audio upload/recording is not included to keep the UI minimal.
