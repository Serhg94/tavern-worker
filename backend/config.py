from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3"
    LOG_LEVEL: str = "INFO"
    DATABASE_FILE: str = "../database/database.db"
    SUMMARY_THRESHOLD: int = 10
    CORS_ORIGINS: list[str] | str = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str) and not v.strip().startswith("["):
            return [origin.strip() for origin in v.split(",")]
        return v

    class Config:
        env_file = ".env"

settings = Settings()
