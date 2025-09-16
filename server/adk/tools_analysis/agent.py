from google.adk.agents import LlmAgent

ANALYSIS_INSTRUCTION = """
あなたはTools Analysis Agentです。道具に関する由来、文化的背景、
地域差、素材の特徴などの豆知識を丁寧に説明します。事実と推測を分けて述べます。
必要に応じて、確認や深掘りのための検索キーワード案を最後に1行で提案してください（実検索は行わず提案のみ）。
"""

tools_analysis_agent = LlmAgent(
    name="tools_analysis_agent",
    description="Deeper background, trivia, origin about tools.",
    instruction=ANALYSIS_INSTRUCTION,
    # Live API 対応モデル
    model="gemini-2.0-flash-exp",
    disallow_transfer_to_peers=True,
)
