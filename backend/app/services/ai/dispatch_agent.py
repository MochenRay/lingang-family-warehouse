def risk_scan(context_id: str | None = None) -> dict[str, object]:
    return {
        "status": "placeholder",
        "agent_type": "dispatch_agent",
        "context_id": context_id,
        "action": "risk-scan",
    }
