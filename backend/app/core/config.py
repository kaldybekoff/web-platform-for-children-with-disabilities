"""Application configuration from environment variables."""
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Database: SQLite by default. For PostgreSQL set DATABASE_URL in .env
    database_url: str = "sqlite:///./qazedu.db"

    # JWT
    # Секретный ключ ДОЛЖЕН быть задан через переменную окружения/файл .env
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # AI (Gemini)
    gemini_api_key: str = ""

    # Admin seed credentials (должны явно задаваться через env при необходимости)
    admin_email: str | None = None
    admin_password: str | None = None
    admin_first_name: str | None = None
    admin_last_name: str | None = None

    # SMTP (email verification). If smtp_username is empty, verification is skipped.
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "QazEdu Special"

    # Frontend URL used in redirect after email verification / OAuth
    frontend_url: str = "http://localhost:3000"

    # Backend public URL (used as OAuth redirect_uri base)
    backend_url: str = "http://localhost:8000"

    # Google OAuth2
    google_client_id: str = ""
    google_client_secret: str = ""

    @property
    def email_verification_enabled(self) -> bool:
        return bool(self.smtp_username and self.smtp_password)

    @property
    def google_oauth_enabled(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

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
