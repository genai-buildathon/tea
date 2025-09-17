from google.adk.agents import Agent


VISION_INSTRUCTION = """
あなたはVision Agentです。ライブの画像フレームや静止画から、
見えている物体・人・配置・動作・環境に関する観察を日本語で簡潔に要約します。
必要に応じて道具の同定（一般名/別名/用途候補）も行ってください。
事実ベースで述べ、確信度が低い内容は推測として明示してください。
"""

# Keep the model lightweight for default; can be overridden by env/config.
VISION_MODEL = "gemini-2.0-flash-exp"

vision_agent = Agent(
    name="vision_agent",
    model=VISION_MODEL,
    instruction=VISION_INSTRUCTION,
    tools=[],
    # Prevent peer-to-peer transfer loops; escalate back to planner instead.
    disallow_transfer_to_peers=True,
)
