from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


DIST_DIR = Path(__file__).resolve().parent.parent / "dist"
API_BASE = "http://api:8000"


class DemoHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST_DIR), **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.startswith("/api/"):
            self._proxy_request("GET")
            return
        self._serve_spa()

    def do_HEAD(self) -> None:  # noqa: N802
        if self.path.startswith("/api/"):
            self._proxy_request("HEAD")
            return
        self._serve_spa(send_body=False)

    def do_POST(self) -> None:  # noqa: N802
        self._proxy_request("POST")

    def do_PUT(self) -> None:  # noqa: N802
        self._proxy_request("PUT")

    def do_PATCH(self) -> None:  # noqa: N802
        self._proxy_request("PATCH")

    def do_DELETE(self) -> None:  # noqa: N802
        self._proxy_request("DELETE")

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._proxy_request("OPTIONS")

    def _serve_spa(self, send_body: bool = True) -> None:
        requested = self.path.split("?", 1)[0].lstrip("/") or "index.html"
        candidate = DIST_DIR / requested
        if candidate.is_dir():
            candidate = candidate / "index.html"
        if not candidate.exists() or not candidate.is_file():
            candidate = DIST_DIR / "index.html"

        content = candidate.read_bytes()
        mime, _ = mimetypes.guess_type(str(candidate))
        self.send_response(200)
        self.send_header("Content-Type", mime or "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        if send_body:
            self.wfile.write(content)

    def _proxy_request(self, method: str) -> None:
        body = None
        if "Content-Length" in self.headers:
            body = self.rfile.read(int(self.headers["Content-Length"]))

        headers = {
            key: value
            for key, value in self.headers.items()
            if key.lower() not in {"host", "content-length"}
        }

        request = Request(f"{API_BASE}{self.path}", data=body, headers=headers, method=method)
        try:
            with urlopen(request, timeout=20) as response:
                payload = response.read()
                self.send_response(response.status)
                for key, value in response.getheaders():
                    if key.lower() in {"transfer-encoding", "connection", "content-length"}:
                        continue
                    self.send_header(key, value)
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                if method != "HEAD":
                    self.wfile.write(payload)
        except HTTPError as error:
            payload = error.read()
            self.send_response(error.code)
            for key, value in error.headers.items():
                if key.lower() in {"transfer-encoding", "connection", "content-length"}:
                    continue
                self.send_header(key, value)
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            if method != "HEAD":
                self.wfile.write(payload)
        except URLError as error:
            payload = str(error).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            if method != "HEAD":
                self.wfile.write(payload)


def main() -> None:
    server = ThreadingHTTPServer(("0.0.0.0", 4173), DemoHandler)
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
