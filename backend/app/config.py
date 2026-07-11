from functools import lru_cache
from typing import Literal

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

    demo_write_mode: Literal["enabled", "readonly", "token"] | None = Field(
        default=None,
        alias="DEMO_WRITE_MODE",
    )
    demo_write_token: str = Field(default="", alias="DEMO_WRITE_TOKEN")
    demo_write_token_header: str = Field(
        default="X-Demo-Write-Token",
        alias="DEMO_WRITE_TOKEN_HEADER",
    )

    ai_enabled: bool = Field(default=True, alias="AI_ENABLED")
    llm_model: str = Field(default="gemini-3.5-flash", alias="LLM_MODEL")
    llm_fallback_model: str = Field(default="gemini-2.5-flash-lite", alias="LLM_FALLBACK_MODEL")
    llm_base_url: str = Field(
        default="https://generativelanguage.googleapis.com/v1beta/openai/",
        alias="LLM_BASE_URL",
    )
    llm_api_key: str = Field(default="", alias="LLM_API_KEY")
    llm_timeout_seconds: float = Field(default=25.0, alias="LLM_TIMEOUT_SECONDS")
    ai_max_prompt_chars: int = Field(default=4_000, ge=1, alias="AI_MAX_PROMPT_CHARS")
    ai_max_output_tokens: int = Field(default=800, ge=1, le=8_192, alias="AI_MAX_OUTPUT_TOKENS")
    ai_rate_limit_requests: int = Field(default=12, ge=1, alias="AI_RATE_LIMIT_REQUESTS")
    ai_rate_limit_window_seconds: int = Field(
        default=60,
        ge=1,
        alias="AI_RATE_LIMIT_WINDOW_SECONDS",
    )

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
    def effective_demo_write_mode(self) -> Literal["enabled", "readonly", "token"]:
        """Keep local development writable while failing closed elsewhere."""
        if self.demo_write_mode is not None:
            return self.demo_write_mode
        if self.app_env.strip().lower() in {"development", "test", "local"}:
            return "enabled"
        return "readonly"

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
