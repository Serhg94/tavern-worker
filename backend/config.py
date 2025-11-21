from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    LOG_LEVEL: str = "INFO"
    DATABASE_FILE: str = "../database/database.db"
    SUMMARY_THRESHOLD: int = 10

    class Config:
        env_file = ".env"

settings = Settings()
