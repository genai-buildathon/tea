from google.adk.agents import LlmAgent

SETTING_INSTRUCTION = """
あなたはSetting Analysis Agentです。映像やテキストの文脈から、
場所・用途・状況設定・道具の組み合わせの意図を推測し、
安全面や注意点も付記して説明します。
"""

setting_analysis_agent = LlmAgent(
    name="setting_analysis_agent",
    description="Scene/setting understanding and reasoning agent.",
    instruction=SETTING_INSTRUCTION,
    # Live API 対応モデル
    model="gemini-2.0-flash-exp",
    disallow_transfer_to_peers=True,
)
