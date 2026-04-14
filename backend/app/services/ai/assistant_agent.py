def visit_outline(context_id: str | None = None) -> dict[str, object]:
    return {
        "status": "placeholder",
        "agent_type": "assistant",
        "context_id": context_id,
        "action": "visit-outline",
    }
