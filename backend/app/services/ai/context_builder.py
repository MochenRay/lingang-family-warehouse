def build_person_context(person_id: str) -> dict[str, object]:
    return {
        "status": "placeholder",
        "context_type": "person",
        "context_id": person_id,
    }


def build_grid_context(grid_id: str) -> dict[str, object]:
    return {
        "status": "placeholder",
        "context_type": "grid",
        "context_id": grid_id,
    }


def build_policy_context(query: str) -> dict[str, object]:
    return {
        "status": "placeholder",
        "context_type": "policy",
        "query": query,
    }
