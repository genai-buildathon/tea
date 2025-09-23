from __future__ import annotations

import logging

from google.adk.agents import LlmAgent
from google.adk.tools.function_tool import FunctionTool
from google.genai import types

from ..setting.agent import analyze_setting
from ..tools_analysis.agent import analyze_tool_history
from ..tools_basic.agent import explain_tool_basics
from ..translator.agent import translate_text
from ..vision.agent import summarize_image

logger = logging.getLogger(__name__)

_instruction_lines = [
    "あなたは茶道支援マルチエージェント群の司令塔(Planner)です。ユーザーの目的を正確に把握し、不足情報があれば確認したうえで適切なツールを呼び出し、最終的な回答を統合します。",
    "",
    "利用可能ツール:",
    "- call_setting_analysis(prompt=...): ビジョン所見やユーザーの質問を渡すと、茶室全体の設え・季節趣向を統合解釈します。",
    "- call_tools_basic(prompt=...): 道具名称や使い方を初心者向けにやさしく解説します。",
    "- call_tools_analysis(prompt=...): 道具の由緒・歴史的背景・千家十職との関連を専門的に説明します。",
    "- call_translation(text=..., target_language=...): 最終出力を指定言語に翻訳します。",
    "",
    "ツール呼び出し時は、他の文章を混ぜずに `call_xxx` 形式で JSON 引数を指定して実行してください。",
    "",
    "判断フロー:",
    "1) ユーザー発話に画像/動画が含まれれば自動でビジョン要約を取得し、テキストとして手元のコンテキストに追加する。必要なら再送依頼を行う。",
    "2) 解析結果やユーザー要望に応じて適切なツールを呼び出し、そのアウトプットを噛み砕いて利用者に伝える。",
    "3) 最終出力の言語指定があれば call_translation で整形する。",
    "",
    "自分で回答する条件: ツール呼び出しが不要な軽微な質問やルーティング判断のみの場合に限り、簡潔に応答する。目的達成に不要な説明は避け、最短経路でゴールへ導くこと。",
]

PLANNER_INSTRUCTION = "\n".join(_instruction_lines)


def _planner_router_before_model(callback_ctx, llm_request):
    """前処理: 画像を要約しテキスト化してからモデルに渡す。"""
    try:
        if not llm_request.contents:
            return None
        last = llm_request.contents[-1]
        if last.role != 'user' or not last.parts:
            return None
        image_payloads = []
        remaining_parts = []
        for part in last.parts:
            inline_data = getattr(part, 'inline_data', None)
            if inline_data and getattr(inline_data, 'mime_type', '').lower() in {'image/jpeg', 'image/png'}:
                if getattr(inline_data, 'data', None):
                    image_payloads.append((inline_data.mime_type or 'image/jpeg', inline_data.data))
                else:
                    logger.warning('画像パートにデータが含まれていません。スキップします。')
            else:
                remaining_parts.append(part)

        if not image_payloads:
            return None

        summaries: list[str] = []
        for idx, (mime, payload) in enumerate(image_payloads, start=1):
            try:
                summary = summarize_image(payload, mime_type=mime)
                if summary:
                    summaries.append(summary.strip())
            except Exception:
                logger.exception("Vision summarization failed for image #%d", idx)
                summaries.append("画像解析に失敗しました。もう一度明るい画像を送ってください。")

        last.parts = remaining_parts
        if summaries:
            combined = "\n\n".join(
                f"[Vision解析{idx}] {text}" for idx, text in enumerate(summaries, start=1) if text
            )
            last.parts.append(types.Part.from_text(text=combined))
    except Exception:
        logger.exception("planner before_model callback failed")
    return None


def call_setting_analysis(prompt: str) -> str:
    """茶室全体の設えと季節趣向を統合的に解説します。"""
    try:
        return analyze_setting(prompt)
    except Exception:
        logger.exception("call_setting_analysis failed")
        return "設え解析ツールの呼び出しに失敗しました。別の情報を添えて再度お試しください。"


def call_tools_basic(prompt: str) -> str:
    """茶道具の名称・用途・扱い方を初心者向けに説明します。"""
    try:
        return explain_tool_basics(prompt)
    except Exception:
        logger.exception("call_tools_basic failed")
        return "茶道具の基礎説明ツールで問題が発生しました。少し時間を置いて再試行してください。"


def call_tools_analysis(prompt: str) -> str:
    """茶道具の由緒や歴史的背景を専門的に解説します。"""
    try:
        return analyze_tool_history(prompt)
    except Exception:
        logger.exception("call_tools_analysis failed")
        return "茶道具の由緒分析ツールの呼び出しに失敗しました。追加情報があれば添えてください。"


def call_translation(text: str, target_language: str) -> str:
    """指定された言語へ自然な文体で翻訳します。"""
    try:
        return translate_text(text=text, target_language=target_language)
    except Exception:
        logger.exception("call_translation failed")
        return "翻訳ツールの呼び出しに失敗しました。target_language と文章をもう一度確認してください。"


planner_agent = LlmAgent(
    name="planner_agent",
    description="Tasks router and coordinator for the multi-agent system.",
    instruction=PLANNER_INSTRUCTION,
    # Live API 対応モデル
    model="gemini-2.0-flash-exp",
    before_model_callback=_planner_router_before_model,
    tools=[
        FunctionTool(call_setting_analysis),
        FunctionTool(call_tools_basic),
        FunctionTool(call_tools_analysis),
        FunctionTool(call_translation),
    ],
)
