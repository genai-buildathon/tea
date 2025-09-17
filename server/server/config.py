from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    VOICE_NAME: str = "Puck"
    SEND_SAMPLE_RATE: int = 16000
    ENABLE_AUDIO: bool = False
    AUDIO_IDLE_END_MS: int = 800
    # Limit concurrent Live API sessions (e.g., Vertex AI live sessions)
    LIVE_SESSIONS_MAX: int = 50


settings = Settings()  # reads from environment if present
