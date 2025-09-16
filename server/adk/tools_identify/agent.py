from google.adk.agents import LlmAgent

TOOLS_IDENTIFY_INSTRUCTION = """
あなたはTools Identify Agentです。映像・画像・説明に現れる道具を特定し、
一般名・別名・用途の候補を列挙します。確信度が低いものは候補として示してください。
"""

tools_identify_agent = LlmAgent(
    name="tools_identify_agent",
    description="Identify tools present in the scene.",
    instruction=TOOLS_IDENTIFY_INSTRUCTION,
    # Live API 対応モデル
    model="gemini-2.0-flash-exp",
    # Avoid ping-pong transfers; return to planner rather than peers.
    disallow_transfer_to_peers=True,
)
