from app.config import Settings


def test_default_llm_model_uses_stable_gemini_35_flash(monkeypatch) -> None:
    monkeypatch.delenv("LLM_MODEL", raising=False)

    settings = Settings(_env_file=None)

    assert settings.llm_model == "gemini-3.5-flash"
