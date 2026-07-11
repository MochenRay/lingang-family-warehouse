from collections import defaultdict, deque
from collections.abc import Callable
from dataclasses import dataclass
from functools import lru_cache
from math import ceil
from threading import Lock
from time import monotonic

from fastapi import HTTPException, Request, status

from app.config import get_settings


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    retry_after_seconds: int


class ProcessRateLimiter:
    """Small per-process sliding-window limiter for the public AI seam."""

    def __init__(
        self,
        *,
        limit: int,
        window_seconds: int,
        clock: Callable[[], float] = monotonic,
    ) -> None:
        self.limit = limit
        self.window_seconds = window_seconds
        self._clock = clock
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, key: str) -> RateLimitDecision:
        now = self._clock()
        cutoff = now - self.window_seconds
        with self._lock:
            timestamps = self._requests[key]
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()
            if len(timestamps) >= self.limit:
                retry_after = max(1, ceil(self.window_seconds - (now - timestamps[0])))
                return RateLimitDecision(allowed=False, retry_after_seconds=retry_after)
            timestamps.append(now)
        return RateLimitDecision(allowed=True, retry_after_seconds=0)

    def reset(self) -> None:
        with self._lock:
            self._requests.clear()


@lru_cache
def get_ai_rate_limiter() -> ProcessRateLimiter:
    settings = get_settings()
    return ProcessRateLimiter(
        limit=settings.ai_rate_limit_requests,
        window_seconds=settings.ai_rate_limit_window_seconds,
    )


def enforce_ai_rate_limit(request: Request) -> None:
    active_limiter = get_ai_rate_limiter()
    client_key = request.client.host if request.client else "unknown"
    decision = active_limiter.check(client_key)
    if not decision.allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI request rate limit exceeded.",
            headers={"Retry-After": str(decision.retry_after_seconds)},
        )
