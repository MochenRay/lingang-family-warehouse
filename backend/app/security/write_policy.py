from collections.abc import Awaitable, Callable
from secrets import compare_digest

from fastapi import Request, Response, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class WriteProtectionMiddleware(BaseHTTPMiddleware):
    """Enforce deployment write policy at the HTTP boundary."""

    def __init__(
        self,
        app,
        *,
        mode: str,
        token: str,
        header_name: str,
        api_prefix: str,
        tag_token: str = "",
        tag_header_name: str = "X-Tag-Write-Token",
    ) -> None:
        super().__init__(app)
        self.mode = mode
        self.token = token
        self.header_name = header_name
        self.api_prefix = api_prefix.rstrip("/")
        self.tag_token = tag_token
        self.tag_header_name = tag_header_name

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if self.mode == "enabled":
            return await call_next(request)
        if self.mode not in {"readonly", "token"}:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"detail": "Write policy mode is not available."},
            )

        if not self._is_business_mutation(request):
            return await call_next(request)

        if self._is_tag_mutation(request):
            provided_tag_token = request.headers.get(self.tag_header_name, "")
            if self.tag_token and compare_digest(provided_tag_token, self.tag_token):
                return await call_next(request)
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "A valid tag administrator token is required."},
            )

        if self.mode == "readonly":
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "Business writes are disabled for this deployment."},
            )

        provided_token = request.headers.get(self.header_name, "")
        if not self.token or not compare_digest(provided_token, self.token):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={"detail": "A valid demo write token is required."},
            )
        return await call_next(request)

    def _is_business_mutation(self, request: Request) -> bool:
        if request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
            return False
        path = request.scope["path"]
        if not (path == self.api_prefix or path.startswith(f"{self.api_prefix}/")):
            return False
        return not path.startswith(f"{self.api_prefix}/ai/")

    def _is_tag_mutation(self, request: Request) -> bool:
        path = request.scope["path"]
        return path == f"{self.api_prefix}/tags" or path.startswith(f"{self.api_prefix}/tags/")
