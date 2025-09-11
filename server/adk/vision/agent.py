from google.adk.agents import Agent


VISION_INSTRUCTION = """
あなたはVision Agentです。ライブの画像フレームや静止画から、
見えている物体・人・配置・動作・環境に関する観察を日本語で簡潔に要約します。
事実ベースで述べ、確信度が低い内容は推測として明示してください。
"""

# Keep the model lightweight for default; can be overridden by env/config.
VISION_MODEL = "gemini-2.0-flash-exp"

vision_agent = Agent(
    name="vision_agent",
    model=VISION_MODEL,
    instruction=VISION_INSTRUCTION,
    tools=[],
)

