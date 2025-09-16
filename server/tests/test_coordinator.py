import asyncio
import types as pytypes
import pytest

from server.core.coordinator import MultimodalServer


class FakeRunner:
    def __init__(self, events):
        self._events = events

    async def run_live(self, **kwargs):  # kwargs ignored
        for e in self._events:
            yield e


class CollectSink:
    def __init__(self):
        self.messages: list[str] = []

    async def send_text(self, data: str):
        self.messages.append(data)


class DummySession:
    def __init__(self, sid: str = "sess-1"):
        self.id = sid


def _event_with_text(text: str):
    part = pytypes.SimpleNamespace(text=text)
    content = pytypes.SimpleNamespace(parts=[part])
    return pytypes.SimpleNamespace(content=content)


def _event_with_audio(b: bytes):
    inline = pytypes.SimpleNamespace(data=b)
    part = pytypes.SimpleNamespace(inline_data=inline)
    content = pytypes.SimpleNamespace(parts=[part])
    return pytypes.SimpleNamespace(content=content)


@pytest.mark.asyncio
async def test_receive_and_process_responses_text():
    server = MultimodalServer()
    runner = FakeRunner([_event_with_text("hello"), _event_with_text("world")])
    sink = CollectSink()
    # Unused fields can be None; FakeRunner ignores
    await server._receive_and_process_responses(
        runner=runner,
        session=DummySession(),
        live_request_queue=None,
        run_config=None,
        sink=sink,
        client_id="c1",
    )
    assert sink.messages == ["hello", "world"]


@pytest.mark.asyncio
async def test_receive_and_process_responses_audio_json():
    server = MultimodalServer()
    audio_bytes = b"\x00\x01\x02"
    runner = FakeRunner([_event_with_audio(audio_bytes)])
    sink = CollectSink()
    await server._receive_and_process_responses(
        runner=runner,
        session=DummySession(),
        live_request_queue=None,
        run_config=None,
        sink=sink,
        client_id="c1",
    )
    assert len(sink.messages) == 1
    assert sink.messages[0].startswith('{"type":"audio"')


def test_mode_instruction_variants():
    server = MultimodalServer()
    cid = "u1"
    # default -> intermediate
    assert "中級者モード" in server._mode_instruction(cid)
    server._user_mode[cid] = "beginner"
    assert "初級者モード" in server._mode_instruction(cid)
    server._user_mode[cid] = "advanced"
    assert "上級者モード" in server._mode_instruction(cid)


@pytest.mark.asyncio
async def test_send_video_content_immediate_calls_send_content(monkeypatch):
    server = MultimodalServer()
    calls = []

    class FakeLrq:
        def send_content(self, content):
            calls.append(content)

    async def fake_sleep(_):
        return None

    monkeypatch.setattr(asyncio, "sleep", fake_sleep)
    await server._send_video_content_immediate(FakeLrq(), "u1", b"abc")
    # First send image turn, then follow-up nudge -> 2 calls expected
    assert len(calls) == 2

