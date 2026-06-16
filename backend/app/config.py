from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite+aiosqlite:///./teampilot.db"
    ALEMBIC_DATABASE_URL: str = "sqlite:///./teampilot.db"
    SECRET_KEY: str = "changeme"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 5
    GROQ_API_KEY: str = ""
    OLLAMA_URL: str = "http://localhost:11434"

    model_config = {"env_file": ".env", "extra": "ignore"}

settings = Settings()
