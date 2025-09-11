
from google.adk.agents import LlmAgent

# Minimal LlmAgent root_agent instance for local development.
translator_agent = LlmAgent(
    name="translator_root_agent",
    description="Root LLM agent for translator module instantiated from Python module.",
    instruction="You are an assistant that replies concisely in Japanese.",
    model="gemini-2.5-flash"
)
