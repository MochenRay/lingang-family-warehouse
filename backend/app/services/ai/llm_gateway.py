from app.config import get_settings


class LLMGateway:
    """Thin placeholder for the future provider-facing LLM adapter."""

    def __init__(self) -> None:
        settings = get_settings()
        self.model = settings.llm_model
        self.base_url = settings.llm_base_url
        self.configured = settings.llm_configured

    def describe(self) -> dict[str, object]:
        return {
            "status": "placeholder",
            "configured": self.configured,
            "model": self.model or None,
            "base_url": self.base_url or None,
        }
