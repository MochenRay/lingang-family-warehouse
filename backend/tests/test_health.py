from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

import app.api.health as health_api


def _build_client() -> TestClient:
    app = FastAPI()
    app.include_router(health_api.router, prefix="/api")
    return TestClient(app)


@pytest.mark.parametrize("mode", ["enabled", "readonly", "token"])
def test_health_reports_effective_demo_write_mode_without_caching(
    monkeypatch: pytest.MonkeyPatch,
    mode: str,
) -> None:
    monkeypatch.setattr(health_api, "check_database", lambda: (True, None))
    monkeypatch.setattr(
        health_api,
        "get_ai_capabilities",
        lambda: {"status": "live"},
    )
    monkeypatch.setattr(
        health_api,
        "get_settings",
        lambda: SimpleNamespace(effective_demo_write_mode=mode),
    )

    response = _build_client().get("/api/health")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {
        "status": "ok",
        "backend": "ready",
        "database": "ok",
        "ai": "live",
        "error": None,
        "demo_write_mode": mode,
    }


def test_health_keeps_capability_and_no_store_header_when_database_is_unavailable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(
        health_api,
        "check_database",
        lambda: (False, "database unavailable"),
    )
    monkeypatch.setattr(
        health_api,
        "get_ai_capabilities",
        lambda: {"status": "degraded"},
    )
    monkeypatch.setattr(
        health_api,
        "get_settings",
        lambda: SimpleNamespace(effective_demo_write_mode="readonly"),
    )

    response = _build_client().get("/api/health")

    assert response.status_code == 503
    assert response.headers["cache-control"] == "no-store"
    assert response.json() == {
        "status": "degraded",
        "backend": "ready",
        "database": "error",
        "ai": "degraded",
        "error": "database unavailable",
        "demo_write_mode": "readonly",
    }
