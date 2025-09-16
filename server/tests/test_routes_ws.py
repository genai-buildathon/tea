import asyncio
from fastapi.testclient import TestClient

import app as app_module


def test_ws_route_sends_msg(monkeypatch):
    app = app_module.app

    async def fake_process_media_stream(agent, websocket, client_id):
        await websocket.send_text("hello-ws")
        # give client a chance to read
        await asyncio.sleep(0)

    # Patch only the processing; keep connect() real
    from server.routes import ws as ws_module
    monkeypatch.setattr(ws_module.server, "process_media_stream", fake_process_media_stream)

    client = TestClient(app)
    with client.websocket_connect("/ws/test-ws") as ws:
        msg = ws.receive_text()
        assert msg == "hello-ws"

