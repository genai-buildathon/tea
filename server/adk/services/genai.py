"""Low-level helpers for calling Gemini models synchronously."""

from __future__ import annotations

import logging
import os
from functools import lru_cache
from typing import Iterable

from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _create_client(
    api_key: str,
    project: str,
    location: str,
    use_vertex: bool,
) -> genai.Client:
    """Instantiate a cached GenAI client based on the active credentials."""
    kwargs: dict[str, object] = {}
    if api_key:
        kwargs["api_key"] = api_key
    if use_vertex:
        kwargs["vertexai"] = True
        if project:
            kwargs["project"] = project
        if location:
            kwargs["location"] = location
    logger.debug(
        "Creating GenAI client (vertex=%s project=%s location=%s)",
        use_vertex,
        project,
        location,
    )
    return genai.Client(**kwargs)


def _should_use_vertex(api_key: str, project: str, location: str) -> bool:
    """Return True when Vertex credentials should be used instead of API key."""
    if api_key:
        return False
    return bool(project and location)


def get_client() -> genai.Client:
    """Return a cached GenAI client using either API key or Vertex settings."""
    api_key = os.getenv("GOOGLE_API_KEY", "")
    project = os.getenv("GOOGLE_CLOUD_PROJECT", "")
    location = os.getenv("GOOGLE_CLOUD_LOCATION", "")
    use_vertex = _should_use_vertex(api_key, project, location)
    return _create_client(api_key, project, location, use_vertex)


def _ensure_config(
    *,
    config: types.GenerateContentConfig | None,
    system_instruction: str | None,
) -> types.GenerateContentConfig | None:
    if config is None and system_instruction is None:
        return None
    cfg = types.GenerateContentConfig() if config is None else config
    if system_instruction:
        cfg.system_instruction = system_instruction
    return cfg


def generate_text(
    *,
    model: str,
    instruction: str,
    prompt: str,
    config: types.GenerateContentConfig | None = None,
) -> types.GenerateContentResponse:
    """Call the text model with a single user prompt and instruction."""
    prompt_text = prompt.strip()
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt_text)])]
    cfg = _ensure_config(config=config, system_instruction=instruction)
    return get_client().models.generate_content(model=model, contents=contents, config=cfg)


def generate_with_parts(
    *,
    model: str,
    instruction: str,
    parts: Iterable[types.Part],
    config: types.GenerateContentConfig | None = None,
) -> types.GenerateContentResponse:
    """Call the model with pre-built parts (e.g., inline images)."""
    content = types.Content(role="user", parts=list(parts))
    cfg = _ensure_config(config=config, system_instruction=instruction)
    return get_client().models.generate_content(model=model, contents=[content], config=cfg)


def get_text_from_response(response: types.GenerateContentResponse) -> str:
    """Extract the first textual answer from a GenerateContentResponse."""
    if not response or not response.candidates:
        return ""
    for candidate in response.candidates:
        content = getattr(candidate, "content", None)
        if not content or not getattr(content, "parts", None):
            continue
        texts: list[str] = []
        for part in content.parts:
            text = getattr(part, "text", None)
            if text:
                texts.append(text)
        if texts:
            return "\n".join(t.strip() for t in texts if t.strip())
    return ""

