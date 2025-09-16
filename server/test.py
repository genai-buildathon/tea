#!/usr/bin/env python3
"""Simple WebSocket and SSE test client for the ADK server (latest API paths).

Usage:
  # WebSocket (default)
  python test.py [agent_key] <user_id> <image_path> [server_base] [origin]

  # SSE
  python test.py sse [agent_key] <user_id> <image_path> [server_base]

Notes:
  - agent_key defaults to "analyze" if omitted.
  - Creates a connection via POST /connections/{agent_key} first, then
    connects to WS: /ws/{agent_key}/{connection_id} or SSE: /sse/{agent_key}/{connection_id}
  - Example: python test.py analyze user-123 frame.jpg http://localhost:8000
"""
import sys
import os
import asyncio
import base64
import json
import websockets
from urllib.parse import urlparse
import urllib.request
import urllib.error
import threading
import time

def _http_post_json(url: str, payload: dict):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _http_get(url: str, headers: dict | None = None, timeout: float = 30.0):
    req = urllib.request.Request(url, headers=headers or {}, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def _create_connection(base: str, agent_key: str, user_id: str, session_id: str | None = None) -> dict:
    url = f"{base.rstrip('/')}/connections/{agent_key}"
    payload = {"user_id": user_id}
    if session_id:
        payload["session_id"] = session_id
    return _http_post_json(url, payload)


async def run_ws(agent_key: str, user_id: str, image_path: str, server_base: str | None = None, origin: str | None = None):
    base = server_base or "http://localhost:8000"
    # Step 1: create a connection to acquire connection_id
    info = _create_connection(base, agent_key, user_id)
    connection_id = info.get("connection_id")
    if not connection_id:
        raise RuntimeError(f"Failed to create connection: {info}")

    # Step 2: connect WS with agent and connection_id
    u = urlparse(base)
    scheme = 'wss' if u.scheme == 'https' else 'ws'
    hostport = u.netloc or u.path
    uri = f"{scheme}://{hostport}/ws/{agent_key}/{connection_id}"
    connect_kwargs = {}
    if origin:
        connect_kwargs["origin"] = origin
    async with websockets.connect(uri, **connect_kwargs) as ws:
        # send a video frame message
        with open(image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")

        msg = {
            "type": "video",
            "data": b64,
            "mode": "test",
            "timestamp": None,
        }

        await ws.send(json.dumps(msg))
        # Also send a short text to trigger response explicitly
        await ws.send(json.dumps({"type":"text","data":"この画像を説明して。"}))
        print("sent video frame + text, waiting for responses (100s)...")

        # listen for responses for a short period
        async def listener():
            try:
                async for message in ws:
                    print("RECV:", message)
            except Exception:
                pass

        # run listener for 5 seconds
        task = asyncio.create_task(listener())
        try:
            await asyncio.sleep(100)
        finally:
            task.cancel()


def _sse_reader(url: str, stop_event: threading.Event):
    req = urllib.request.Request(url, headers={"Accept": "text/event-stream"}, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            buf = b""
            while not stop_event.is_set():
                chunk = resp.readline()
                if not chunk:
                    break
                line = chunk.decode("utf-8", errors="ignore").rstrip("\r\n")
                if line.startswith("data:"):
                    print("SSE:", line[5:].strip())
    except Exception as e:
        print("SSE reader error:", e)


def run_sse(agent_key: str, user_id: str, image_path: str, server_base: str | None = None):
    base = server_base or "http://localhost:8000"
    # Step 1: create a connection
    info = _create_connection(base, agent_key, user_id)
    connection_id = info.get("connection_id")
    if not connection_id:
        raise RuntimeError(f"Failed to create connection: {info}")

    # Step 2: open SSE and send data to new paths
    sse_url = f"{base.rstrip('/')}/sse/{agent_key}/{connection_id}"
    text_url = f"{base.rstrip('/')}/sse/{agent_key}/{connection_id}/text"
    video_url = f"{base.rstrip('/')}/sse/{agent_key}/{connection_id}/video"

    # start SSE in background thread
    stop_evt = threading.Event()
    t = threading.Thread(target=_sse_reader, args=(sse_url, stop_evt), daemon=True)
    t.start()

    # give the server a moment to initialize client state
    time.sleep(0.3)

    # send video
    with open(image_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    _http_post_json(video_url, {"type": "video", "data": b64, "mode": "test", "timestamp": None})

    # send a short text prompt
    _http_post_json(text_url, {"type": "text", "data": "この画像を説明して。"})

    print("sent SSE video + text, listening for 30s...")
    try:
        time.sleep(30)
    finally:
        stop_evt.set()

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage (WS):  python test.py [agent_key] <user_id> <image_path> [server_base] [origin]")
        print("Usage (SSE): python test.py sse [agent_key] <user_id> <image_path> [server_base]")
        raise SystemExit(1)

    if sys.argv[1].lower() == "sse":
        # Forms:
        #  - python test.py sse <user_id> <image> [base]
        #  - python test.py sse <agent_key> <user_id> <image> [base]
        if len(sys.argv) < 4:
            print("Usage (SSE): python test.py sse [agent_key] <user_id> <image_path> [server_base]")
            raise SystemExit(1)
        # Prefer file-based heuristic to decide if agent_key is provided
        if len(sys.argv) >= 5 and os.path.isfile(sys.argv[4]):
            # sse <agent_key> <user_id> <image>
            agent_key = sys.argv[2]
            user_id = sys.argv[3]
            image_path = sys.argv[4]
            server_base = sys.argv[5] if len(sys.argv) > 5 else "http://localhost:8000"
        elif os.path.isfile(sys.argv[3]):
            # sse <user_id> <image>
            agent_key = "analyze"
            user_id = sys.argv[2]
            image_path = sys.argv[3]
            server_base = sys.argv[4] if len(sys.argv) > 4 else "http://localhost:8000"
        else:
            # Fallback to positional assumption with agent
            agent_key = sys.argv[2] if len(sys.argv) > 2 else "analyze"
            user_id = sys.argv[3] if len(sys.argv) > 3 else "user-1"
            image_path = sys.argv[4] if len(sys.argv) > 4 else "frame.jpg"
            server_base = sys.argv[5] if len(sys.argv) > 5 else "http://localhost:8000"
        run_sse(agent_key, user_id, image_path, server_base)
    else:
        # Forms:
        #  - python test.py <user_id> <image> [base] [origin]
        #  - python test.py <agent_key> <user_id> <image> [base] [origin]
        if len(sys.argv) >= 4 and os.path.isfile(sys.argv[3]):
            # <agent_key> <user_id> <image>
            agent_key = sys.argv[1]
            user_id = sys.argv[2]
            image_path = sys.argv[3]
            server_base = sys.argv[4] if len(sys.argv) > 4 else "http://localhost:8000"
            origin = sys.argv[5] if len(sys.argv) > 5 else server_base
        elif os.path.isfile(sys.argv[2]):
            # <user_id> <image>
            agent_key = "analyze"
            user_id = sys.argv[1]
            image_path = sys.argv[2]
            server_base = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:8000"
            origin = sys.argv[4] if len(sys.argv) > 4 else server_base
        else:
            # Fallback to positional assumption with agent
            agent_key = sys.argv[1]
            user_id = sys.argv[2] if len(sys.argv) > 2 else "user-1"
            image_path = sys.argv[3] if len(sys.argv) > 3 else "frame.jpg"
            server_base = sys.argv[4] if len(sys.argv) > 4 else "http://localhost:8000"
            origin = sys.argv[5] if len(sys.argv) > 5 else server_base
        asyncio.run(run_ws(agent_key, user_id, image_path, server_base, origin))
