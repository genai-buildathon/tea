from google.adk.agents import LlmAgent
from google.genai import types
from google.adk.models.llm_response import LlmResponse

from ..vision.agent import vision_agent
from ..setting.agent import setting_analysis_agent
from ..tools_basic.agent import tools_basic_knowledge_agent
from ..tools_analysis.agent import tools_analysis_agent
from ..translator.agent import translator_agent

_instruction_lines = [
    "あなたは茶道支援マルチエージェント群の司令塔(Planner)です。ユーザーの目的を正確に把握し、不足情報があれば確認したうえで適切な下位エージェントへタスクを割り振ります。",
    "",
    "利用可能エージェント:",
    "- Vision Agent: 画像/動画の把握・要約・茶道具同定",
    "- Setting Analysis Agent: 空間設え・道具取合せ・季節趣向の統合解釈",
    "- Tools Basic Knowledge Agent: 道具の用途・基本的な扱いの説明",
    "- Tools Analysis Agent: 道具にまつわる由来・歴史・文化的背景",
    "- Translator Agent: ユーザー希望言語への変換（入力/出力）",
    "",
    "移譲ルール: 他エージェントへ処理を移す際は説明文を書かず、必ず `transfer_to_agent(agent_name=<正確なname>)` をツール実行し、それ以外のテキストを出力しないこと。",
    "",
    "判断フロー:",
    "1) ユーザー発話に画像/動画が含まれれば最優先で Vision Agent に移譲して状況把握する。",
    "2) Visionの結果やユーザー要望に応じて、道具の基礎情報は Basic、由来・文化的洞察は Analysis を選択する。",
    "3) シーン全体の趣向や設えの統合説明が必要な場合は Setting Analysis を呼ぶ。",
    "4) 最終出力の言語指定があれば Translator で整形する。",
    "",
    "自分で回答する条件: 移譲が不要な軽微な質問やルーティング判断のみの場合に限り、簡潔に応答する。目的達成に不要な説明は避け、最短経路でゴールへ導くこと。",
]

PLANNER_INSTRUCTION = "\n".join(_instruction_lines)


def _planner_router_before_model(callback_ctx, llm_request):
    """前処理ルーティング: 画像が来たら即 Vision に移譲。

    LLM を呼ぶ前に FunctionResponse を返すことで、確実に transfer を実行します。
    何も該当しなければ None を返して通常の LLM 推論にフォールバックします。
    """
    try:
        if not llm_request.contents:
            return None
        last = llm_request.contents[-1]
        if last.role != 'user' or not last.parts:
            return None
        # 画像パートが含まれていれば Vision へ移譲
        has_image = any(
            getattr(p, 'inline_data', None) is not None and getattr(p.inline_data, 'mime_type', '') in ('image/jpeg','image/png')
            for p in last.parts
        )
        if has_image:
            target = 'vision_agent'
            fr = types.FunctionResponse(name='transfer_to_agent', response={'agent_name': target})
            return LlmResponse(
                content=types.Content(role='model', parts=[types.Part(function_response=fr)])
            )
    except Exception:
        pass
    return None


planner_agent = LlmAgent(
    name="planner_agent",
    description="Tasks router and coordinator for the multi-agent system.",
    instruction=PLANNER_INSTRUCTION,
    # Live API 対応モデル
    model="gemini-2.0-flash-exp",
    before_model_callback=_planner_router_before_model,
    sub_agents=[
        vision_agent,
        setting_analysis_agent,
        tools_basic_knowledge_agent,
        tools_analysis_agent,
        translator_agent,
    ],
)
