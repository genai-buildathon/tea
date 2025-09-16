from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    VOICE_NAME: str = "Puck"
    SEND_SAMPLE_RATE: int = 16000
    ENABLE_AUDIO: bool = False
    AUDIO_IDLE_END_MS: int = 800


settings = Settings()  # reads from environment if present

