from app.config import Settings


def test_default_llm_settings_use_stable_gemini_36_flash(monkeypatch) -> None:
    monkeypatch.delenv("LLM_MODEL", raising=False)
    monkeypatch.delenv("AI_REASONING_EFFORT", raising=False)
    monkeypatch.delenv("AI_MAX_OUTPUT_TOKENS", raising=False)

    settings = Settings(_env_file=None)

    assert settings.llm_model == "gemini-3.6-flash"
    assert settings.ai_reasoning_effort == "low"
    assert settings.ai_max_output_tokens == 4_096
