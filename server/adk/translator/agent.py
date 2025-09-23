
from __future__ import annotations

from ..services.genai import generate_text, get_text_from_response

TRANSLATOR_INSTRUCTION = """You are a precise translation assistant."""
TRANSLATOR_MODEL = "gemini-2.0-flash-exp"


def translate_text(
    text: str,
    *,
    target_language: str,
    model: str = TRANSLATOR_MODEL,
) -> str:
    """Translate text into the requested language while preserving tone."""
    text_body = text.strip()
    language = target_language.strip()
    if not text_body:
        return "翻訳する文章が指定されていません。"
    if not language:
        return "翻訳先の言語を `target_language` に指定してください。"
    prompt = (
        f"Translate the following content into {language} with natural tone:\n{text_body}"
    )
    response = generate_text(model=model, instruction=TRANSLATOR_INSTRUCTION, prompt=prompt)
    translated = get_text_from_response(response)
    return translated.strip() if translated else ""
