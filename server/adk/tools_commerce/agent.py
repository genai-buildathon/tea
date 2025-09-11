from google.adk.agents import LlmAgent

# Minimal product DB placeholder
COMMERCE_DB = {
    "包丁": [
        {"name": "三徳包丁 180mm", "link": "https://example.com/santoku", "price": "¥4,980"},
    ],
    "金槌": [
        {"name": "大工用ハンマー", "link": "https://example.com/hammer", "price": "¥1,280"},
    ],
}

COMMERCE_INSTRUCTION = """
あなたはTools Commerce Agentです。指定された道具の購入候補を案内します。
内部DBがあればそれを優先し、なければ一般的な購入先（量販店カテゴリ等）を提案します。
アフィリエイト等の実URLはダミーで構いません。価格は目安として表現します。
"""

tools_commerce_agent = LlmAgent(
    name="tools_commerce_agent",
    description="Suggest purchase options for tools.",
    instruction=COMMERCE_INSTRUCTION + "\n既知の商品カテゴリ:" + ", ".join(COMMERCE_DB.keys()),
    model="gemini-2.5-flash",
)

