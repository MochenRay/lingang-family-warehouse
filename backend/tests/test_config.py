import pytest

from app.config import Settings


def test_default_llm_settings_use_stable_gemini_36_flash(monkeypatch) -> None:
    monkeypatch.delenv("LLM_MODEL", raising=False)
    monkeypatch.delenv("AI_REASONING_EFFORT", raising=False)
    monkeypatch.delenv("AI_MAX_OUTPUT_TOKENS", raising=False)

    settings = Settings(_env_file=None)

    assert settings.llm_model == "gemini-3.6-flash"
    assert settings.ai_reasoning_effort == "low"
    assert settings.ai_max_output_tokens == 4_096


def test_reference_time_is_allowed_only_outside_production() -> None:
    development = Settings(
        _env_file=None,
        APP_ENV="development",
        TEST_REFERENCE_TIME="2026-07-15T04:00:00Z",
    )
    production = Settings(
        _env_file=None,
        APP_ENV="production",
        TEST_REFERENCE_TIME="2026-07-15T04:00:00Z",
    )

    assert development.effective_test_reference_time.isoformat() == "2026-07-15T12:00:00+08:00"
    with pytest.raises(RuntimeError, match="only allowed in non-production"):
        production.effective_test_reference_time
