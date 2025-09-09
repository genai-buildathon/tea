from google.adk.agents.llm_agent import LlmAgent
from google.adk.tools import google_search
import os
import vertexai

PROJECT_ID = 'ntv-contech-poc'
LOCATION = 'us-central1'

vertexai.init(project=PROJECT_ID, location=LOCATION,
              staging_bucket=f'gs://{PROJECT_ID}')

os.environ['GOOGLE_CLOUD_PROJECT'] = PROJECT_ID
os.environ['GOOGLE_CLOUD_LOCATION'] = LOCATION
os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'True'

analysis_prompts = {
            "tool_identification": """
あなたは茶道の専門家です。画像に写っている茶道具を分析し、以下の情報を提供してください：

1. 道具の名称と種類
2. 材質や技法の特徴
3. 季節性や文様の意味
4. 歴史的背景や作家情報（推定可能な場合）
5. 茶道における使用方法や意義

日本語で丁寧に、初心者にも分かりやすく説明してください。
""",
            "setting_analysis": """
あなたは茶道の専門家です。茶室の設えを分析し、以下について解説してください：

1. 床の間の設え（掛物、花入、香合など）
2. 季節感の演出方法
3. 亭主のおもてなしの心
4. 取り合わせの美意識
5. 各要素の調和と意味

茶会の背景にある文化的意味も含めて、日本語で解説してください。
""",
            "seasonal_context": """
現在の季節を考慮して、画像の茶道具や設えの季節感について分析してください：

1. 季節に適した道具選び
2. 文様や色彩の季節性
3. 茶会の時期に込められた意味
4. 季節の移ろいの表現

日本語で季節感豊かに説明してください。
"""
}

seasonal_review_agent = LlmAgent(
    name='seasonal_review_agent',
    # model='gemini-2.5-flash',
    model='gemini-live-2.5-flash',
    description='季節感を解説するエージェント',
    instruction=analysis_prompts['seasonal_context'],
    # tools=[google_search]
)

tool_identify_agent = LlmAgent(
    name='tool_identify_agent',
    # model='gemini-2.5-flash',
    model='gemini-live-2.5-flash',
    description='道具を解説するエージェント',
    instruction=analysis_prompts['tool_identification'],
    # tools=[google_search]
)

setting_analysis_agent = LlmAgent(
    name='setting_analysis_agent',
    # model='gemini-2.5-flash',
    model='gemini-live-2.5-flash',
    description='茶室を解説するエージェント',
    instruction=analysis_prompts['setting_analysis'],
    # tools=[google_search]
)

root_agent = LlmAgent(
    name='setting_analysis_agent',
    # model='gemini-2.5-flash',
    model='gemini-live-2.5-flash',
    description='回答を計画するエージェント',
    instruction='質問に応じてseasonal_review_agent、tool_identify_agent、setting_analysis_agentに振り分けて',
    sub_agents=[seasonal_review_agent, tool_identify_agent, setting_analysis_agent]
)