from google.adk.agents import LlmAgent

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

判断基準:
1) まずVision Agentで状況把握が必要かを検討
2) 道具が写っていればTools Identifyへ依頼
3) その結果に応じてBasic/Analysis/Commerceへ情報照会
4) 必要に応じてSetting Analysisでシーン全体を説明
5) ユーザーの希望言語があればTranslatorで最終整形

回答は簡潔な日本語を基本とし、段階的に根拠を示します。
"""


planner_agent = LlmAgent(
    name="planner_agent",
    description="Tasks router and coordinator for the multi-agent system.",
    instruction=PLANNER_INSTRUCTION,
    model="gemini-2.5-flash",
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

