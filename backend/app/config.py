from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Lingang Family Warehouse API"
    app_env: str = Field(default="development", alias="APP_ENV")
    app_version: str = "0.1.0"
    api_prefix: str = "/api"

    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/lingang_family_warehouse",
        alias="DATABASE_URL",
    )
    database_echo: bool = Field(default=False, alias="DATABASE_ECHO")

    ai_enabled: bool = Field(default=True, alias="AI_ENABLED")
    llm_model: str = Field(default="gemini-3.1-flash-lite", alias="LLM_MODEL")
    llm_fallback_model: str = Field(default="gemini-2.5-flash-lite", alias="LLM_FALLBACK_MODEL")
    llm_base_url: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta/openai/",
        alias="LLM_BASE_URL",
    )
    llm_api_key: str = Field(default="", alias="LLM_API_KEY")
    llm_timeout_seconds: float = Field(default=25.0, alias="LLM_TIMEOUT_SECONDS")

    cors_origins_raw: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173",
        alias="CORS_ORIGINS",
    )

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins_raw.split(",") if origin.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        raw_url = self.database_url.strip()
        if raw_url.startswith("postgres://"):
            return raw_url.replace("postgres://", "postgresql+psycopg://", 1)
        if raw_url.startswith("postgresql://"):
            return raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
        return raw_url

    @property
    def llm_configured(self) -> bool:
        return bool(self.llm_model and self.llm_base_url and self.llm_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
