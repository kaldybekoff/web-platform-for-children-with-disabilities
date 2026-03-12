"""Application configuration from environment variables."""
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Database: SQLite by default. For PostgreSQL set DATABASE_URL in .env
    database_url: str = "sqlite:///./qazedu.db"

    # JWT
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # AI (Gemini)
    gemini_api_key: str = ""

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()

# Debug: print loaded API key status at startup
if settings.gemini_api_key:
    print(f"[CONFIG] Gemini API key loaded (length: {len(settings.gemini_api_key)})")
else:
    print(f"[CONFIG] WARNING: Gemini API key NOT loaded. ENV_FILE path: {ENV_FILE}, exists: {ENV_FILE.exists()}")
