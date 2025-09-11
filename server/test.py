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

async def run(client_id: str, image_path: str, origin: str | None = None):
    uri = f"ws://0.0.0.0:8000/ws/{client_id}"
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
        print("sent video frame, waiting for responses (5s)...")

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
        print("Usage: python test.py <client_id> <image_path> [origin]")
        raise SystemExit(1)
    client_id = sys.argv[1]
    image_path = sys.argv[2]
    origin = sys.argv[3] if len(sys.argv) > 3 else "http://localhost:8000"
    asyncio.run(run(client_id, image_path, origin))