from fastapi.testclient import TestClient
import types as pytypes

import app as app_module


def test_sse_stream_emits_ready_and_model_text(monkeypatch):
    app = app_module.app
    client = TestClient(app)

    # Patch config/auth and wire a fake runner + LRQ
    from server.routes import sse as sse_module

    # Ensure no audio branch to keep config simple
    monkeypatch.setattr(sse_module.settings, "ENABLE_AUDIO", False)

    # Force auth OK
    monkeypatch.setattr(sse_module.server, "_ensure_google_config", lambda: True)

    class FakeRunner:
        def __init__(self, *args, **kwargs):
            pass

        async def run_live(self, **kwargs):
            # yield a single text event
            part = pytypes.SimpleNamespace(text="hello-sse")
            content = pytypes.SimpleNamespace(parts=[part])
            yield pytypes.SimpleNamespace(content=content)

    class FakeLRQ:
        def send_content(self, *args, **kwargs):
            pass

    monkeypatch.setattr(sse_module, "Runner", FakeRunner)
    monkeypatch.setattr(sse_module, "LiveRequestQueue", lambda: FakeLRQ())

    cid = "test-sse"
    with client.stream("GET", f"/sse/{cid}") as resp:
        assert resp.status_code == 200
        lines = []
        for chunk in resp.iter_lines():
            if not chunk:
                continue
            s = chunk.decode("utf-8") if isinstance(chunk, (bytes, bytearray)) else chunk
            lines.append(s)
            # Expect at least ready and a data line with our text
            if s.startswith("data:") and "hello-sse" in s:
                break
        assert any(l.startswith("event: ready") for l in lines)
        assert any("hello-sse" in l for l in lines if l.startswith("data:"))

    # While stream was open, server registered state; it should cleanup on close
    # But POST should also work while open; test a simple text POST separately
    # Re-open and post a text input
    with client.stream("GET", f"/sse/{cid}") as resp:
        assert resp.status_code == 200
        r = client.post(f"/sse/{cid}/text", json={"data": "この画像を説明して。"})
        assert r.status_code == 200
        assert r.json().get("ok") is True

