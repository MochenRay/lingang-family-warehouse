def suggest_tags(context_id: str | None = None) -> dict[str, object]:
    return {
        "status": "placeholder",
        "agent_type": "data_agent",
        "context_id": context_id,
        "action": "suggest-tags",
    }
