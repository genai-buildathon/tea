from google.adk.agents import LlmAgent
from google.genai import types
from google.adk.models.llm_response import LlmResponse

from ..vision.agent import vision_agent
from ..setting.agent import setting_analysis_agent
from ..tools_identify.agent import tools_identify_agent
from ..tools_basic.agent import tools_basic_knowledge_agent
from ..tools_analysis.agent import tools_analysis_agent
from ..tools_commerce.agent import tools_commerce_agent
from ..translator.agent import translator_agent


PLANNER_INSTRUCTION = """
あなたはマルチエージェントの司令塔(Planner)です。ユーザーの目的を把握し、以下の下位エージェントへ適切にタスクを割り振ります。

- Vision Agent: リアルタイム映像/画像の把握と要約
- Setting Analysis Agent: 場所や状況の設定、道具の組み合わせなどの解釈
- Tools Identify Agent: 映っている道具の同定
- Tools Basic Knowledge Agent: 道具の基本的な使い方・一般知識
- Tools Analysis Agent: 道具特有の由来・文化・豆知識など
- Tools Commerce Agent: 道具の購入先・販売情報の提示
- Translator Agent: 言語変換(入力/出力)

重要: 他のエージェントに処理を移す(移譲する)場合は、説明文を書かず、必ず関数 `transfer_to_agent` をツール実行しなさい。引数 `agent_name` には上記エージェントの `name` を正確に指定します。移譲時は関数呼び出し以外のテキストを出力しないでください。

判断基準:
1) まずVision Agentで状況把握が必要かを検討
2) 道具/物体の特定が適切なら Tools Identify へ移譲
3) 結果に応じて Basic/Analysis/Commerce を呼び分け
4) 必要に応じて Setting Analysis でシーン全体を説明
5) ユーザーの希望言語があれば Translator で最終整形

通常は最短経路でゴールに到達する移譲を行い、移譲しない場合のみ自分で簡潔に回答します。
"""


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
        # 画像パートが含まれていれば Vision/Identify へ移譲（1回目はVision、2回目以降はIdentify）
        has_image = any(
            getattr(p, 'inline_data', None) is not None and getattr(p.inline_data, 'mime_type', '') in ('image/jpeg','image/png')
            for p in last.parts
        )
        if has_image:
            routed = bool(callback_ctx.state.get('vision_routed'))
            if not routed:
                callback_ctx.state['vision_routed'] = True
                target = 'vision_agent'
            else:
                target = 'tools_identify_agent'
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
        tools_identify_agent,
        tools_basic_knowledge_agent,
        tools_analysis_agent,
        tools_commerce_agent,
        translator_agent,
    ],
)
