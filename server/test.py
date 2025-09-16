#!/usr/bin/env python3
"""Simple WebSocket test client for the ADK Video Analysis server.

Usage:
  python test.py <client_id> <image_path>

Connects to ws://0.0.0.0:8000/ws/{client_id}, sends a sample video message (base64
JPEG) and prints any responses received for a short time.
"""
import sys
import asyncio
import base64
import json
import websockets
from urllib.parse import urlparse

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

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python test.py <client_id> <image_path> [server_base] [origin]")
        raise SystemExit(1)
    client_id = sys.argv[1]
    image_path = sys.argv[2]
    server_base = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:8000"
    origin = sys.argv[4] if len(sys.argv) > 4 else server_base
    asyncio.run(run(client_id, image_path, server_base, origin))
