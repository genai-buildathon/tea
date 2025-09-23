from __future__ import annotations

from google.genai import types

from ..services.genai import generate_with_parts, get_text_from_response


VISION_INSTRUCTION = """
あなたはVision Agentです。ライブの画像フレームや静止画から、
見えている物体・人・配置・動作・環境を視覚的事実に基づいて日本語で簡潔に要約します。

1. 茶道具や茶席に関わる要素を優先的に観察し、名称候補・材質・形状・配置などの特徴を挙げてください。
   - 確信度が十分でない場合は「〜かもしれません」「〜の可能性があります」と明示し、過剰な断定は避けます。
   - 画像から読み取れない情報（歴史、逸話など）は推測しないでください。
2. 茶道具や茶席に関わるものが見当たらない場合は、「茶道具が映っていないようです。」とだけ返し、それ以上の説明はしないでください。
3. ひとつの道具が複数の候補に該当する場合は、最も可能性が高いものから順に示し、判断理由を簡潔に添えます。
4. 観察結果は整理された文章でまとめ、必要に応じて箇条書きで道具名と特徴を対応させます。
"""

# Keep the model lightweight for default; can be overridden by env/config.
VISION_MODEL = "gemini-2.0-flash-exp"


def summarize_image(
    image_bytes: bytes,
    *,
    mime_type: str = "image/jpeg",
    instruction: str = VISION_INSTRUCTION,
    model: str = VISION_MODEL,
) -> str:
    """Return a textual summary for the provided image bytes.

    Args:
        image_bytes: Raw image payload captured from the client.
        mime_type: MIME type of the image. Defaults to JPEG.
        instruction: Prompt steering the vision model.
        model: Target Gemini model name.

    Returns:
        The model's textual summary.
    """
    if not image_bytes:
        raise ValueError("image_bytes must contain data for summarization.")

    parts = [
        types.Part.from_text(text="以下の画像について、観察結果を説明してください。"),
        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
    ]

    response = generate_with_parts(model=model, instruction=instruction, parts=parts)
    text = get_text_from_response(response)
    return text.strip() if text else ""
