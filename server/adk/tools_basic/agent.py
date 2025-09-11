from google.adk.agents import LlmAgent

# Simple in-memory knowledge base (placeholder)
BASIC_KB = {
    "包丁": "料理用の刃物。まな板上で食材を切るのに使う。取り扱いは慎重に。",
    "金槌": "釘打ちなどに使う工具。作業時はゴーグル・手袋を推奨。",
}

BASIC_INSTRUCTION = """
あなたはTools Basic Knowledge Agentです。入力された道具名に対し、
基本的な用途、取り扱いの注意、一般的な使い方を簡潔に返します。
内部の小さな知識ベースを照会し、未登録の場合は一般知識を推論して回答します。
"""

tools_basic_knowledge_agent = LlmAgent(
    name="tools_basic_knowledge_agent",
    description="Basic usage and safety of tools (small KB).",
    instruction=BASIC_INSTRUCTION + "\n既知の項目:" + ", ".join(BASIC_KB.keys()),
    model="gemini-2.5-flash",
)

