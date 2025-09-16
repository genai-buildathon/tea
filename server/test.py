#!/usr/bin/env python3
"""Simple WebSocket and SSE test client for the ADK Video Analysis server.

Usage:
  # WebSocket (default)
  python test.py <client_id> <image_path> [server_base] [origin]

  # SSE
  python test.py sse <client_id> <image_path> [server_base]

Connects to ws://localhost:8000/ws/{client_id} or http://localhost:8000/sse/{client_id},
sends a sample image frame and a short text prompt, and prints responses.
"""
import sys
import asyncio
import base64
import json
import websockets
from urllib.parse import urlparse
import urllib.request
import urllib.error
import threading
import time

async def run(client_id: str, image_path: str, server_base: str | None = None, origin: str | None = None):
    if server_base:
        u = urlparse(server_base)
        scheme = 'wss' if u.scheme == 'https' else 'ws'
        hostport = u.netloc or u.path
        uri = f"{scheme}://{hostport}/ws/{client_id}"
    else:
        uri = f"ws://localhost:8000/ws/{client_id}"
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


def _http_post_json(url: str, payload: dict):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


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


def run_sse(client_id: str, image_path: str, server_base: str | None = None):
    base = server_base or "http://localhost:8000"
    sse_url = f"{base.rstrip('/')}/sse/{client_id}"
    text_url = f"{base.rstrip('/')}/sse/{client_id}/text"
    video_url = f"{base.rstrip('/')}/sse/{client_id}/video"

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
        print("Usage (WS):  python test.py <client_id> <image_path> [server_base] [origin]")
        print("Usage (SSE): python test.py sse <client_id> <image_path> [server_base]")
        raise SystemExit(1)

    if sys.argv[1].lower() == "sse":
        if len(sys.argv) < 4:
            print("Usage (SSE): python test.py sse <client_id> <image_path> [server_base]")
            raise SystemExit(1)
        client_id = sys.argv[2]
        image_path = sys.argv[3]
        server_base = sys.argv[4] if len(sys.argv) > 4 else "http://localhost:8000"
        run_sse(client_id, image_path, server_base)
    else:
        client_id = sys.argv[1]
        image_path = sys.argv[2]
        server_base = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:8000"
        origin = sys.argv[4] if len(sys.argv) > 4 else server_base
        asyncio.run(run(client_id, image_path, server_base, origin))
