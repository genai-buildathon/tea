from google.adk.agents import LlmAgent


# Alternate root agent example: generates metadata from prior context.
# Shares the same Session (app_name) so it can leverage history.
root_agent_alt = LlmAgent(
    name="metadata_root_agent",
    description="Generates concise metadata based on prior session context.",
    instruction=(
        "あなたはメタデータ生成エージェントです。これまでの対話/観察履歴を踏まえ、\n"
        "- 目的/タスク: 箇条書き要約\n"
        "- 主要な道具/対象: 箇条書き\n"
        "- シーン/設定: 一言要約\n"
        "- キーイベント: 3件まで\n"
        "- 重要キーワード: 3-8語\n"
        "の形式で、短く出力してください。JSONでなくテキストで構いません。"
    ),
    model="gemini-2.0-flash-exp",
)

