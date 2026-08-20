from app.config import get_settings
from app.services.task_rules import days_since


def test_days_since_uses_the_injected_test_reference_time(monkeypatch) -> None:
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("TEST_REFERENCE_TIME", "2026-07-15T04:00:00Z")
    get_settings.cache_clear()

    try:
        assert days_since("2026-07-01 12:00") == 14
    finally:
        get_settings.cache_clear()
