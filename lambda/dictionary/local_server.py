"""
Runs the dictionary Lambda locally, behind a stand-in for API Gateway.

    # once: build an artifact from the committed fixture
    cd ../dictionary-build
    uv run python build.py ru --source fixtures/ru-sample.jsonl --out ../../.artifacts/ru.sqlite

    # then
    cd ../dictionary
    DICTIONARY_CACHE_DIR=../../.artifacts uv run python local_server.py

Point the app at it and everything works unchanged:

    API_GW_URL=http://127.0.0.1:9010

The problem this solves is that `callApiGateway` sends every NLP request to
`API_GW_URL`, so with no local option a developer has to deploy the Lambda before
they can see the dictionary at all. Pointing `API_GW_URL` at a shim that only
*owns* `/dictionary/*` and forwards everything else to the real gateway means the
dictionary runs from local source while morphology, inflections, translate and tts
keep coming from the deployed environment. Without the forwarding this would be a
worse trade than deploying, because the dictionary's fallback chain calls the
morphology service to resolve inflected input.

Two things it deliberately does not do. It is not a general Lambda emulator --
`lambda/*/README.md` documents the AWS runtime interface emulator for that, and
this exists because the zip Lambdas have no Dockerfile. And it does not reload on
edit: restart it, the process starts in well under a second.

Development only. Never deployed: the packager excludes it (see
`lambda_source_excludes` in terraform/application/locals.tf).
"""

import argparse
import json
import logging
import os
import sys
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.request import urlopen

import lambda_handler

DEFAULT_PORT = 9010

#: Paths this shim answers itself. Everything else is forwarded.
OWNED_PREFIX = "/dictionary/"

logger = logging.getLogger("local_server")


class Handler(BaseHTTPRequestHandler):
    """Translates an HTTP request into an API Gateway v2 proxy event."""

    # Set by main() rather than passed through the constructor, which
    # BaseHTTPRequestHandler does not let us extend cleanly.
    upstream_url: str | None = None
    upstream_key: str | None = None
    #: True when forwarding was switched off deliberately, so the 502 for another
    #: service can say which of the two reasons it is.
    proxy_disabled: bool = False

    protocol_version = "HTTP/1.1"

    def do_POST(self) -> None:  # noqa: N802 - name fixed by BaseHTTPRequestHandler
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length).decode("utf-8") if length else ""

        if self.path.startswith(OWNED_PREFIX):
            self._invoke(body)
        else:
            self._forward(body)

    def do_GET(self) -> None:  # noqa: N802
        # Enough for a readiness check; the services themselves are POST-only.
        if self.path == "/health":
            self._respond(200, json.dumps({"status": "ok"}))
        else:
            self._respond(405, json.dumps({"error": "Use POST"}))

    def _invoke(self, body: str) -> None:
        """Call the handler in-process, with the event shape it expects."""
        event = {
            "version": "2.0",
            "rawPath": self.path,
            "path": self.path,
            "headers": dict(self.headers),
            "requestContext": {"http": {"method": "POST", "path": self.path}},
            "body": body,
            "isBase64Encoded": False,
        }

        try:
            response = lambda_handler.handler(event, None)
        except Exception as e:  # noqa: BLE001 - a dev server must not die on one bad request
            logger.exception("handler raised")
            self._respond(500, json.dumps({"error": f"{type(e).__name__}: {e}"}))
            return

        self._respond(
            response.get("statusCode", 500),
            response.get("body", ""),
            response.get("headers") or {},
        )

    def _forward(self, body: str) -> None:
        """
        Pass a request for another service through to the real gateway.

        Failures are reported as 502 rather than raised: a missing upstream is a
        normal state when working offline on the dictionary alone, and it should
        degrade the other services rather than take the shim down.
        """
        if not self.upstream_url:
            reason = (
                "forwarding is disabled (--no-proxy)"
                if self.proxy_disabled
                else "DICTIONARY_UPSTREAM_URL is not set"
            )
            self._respond(
                502,
                json.dumps(
                    {
                        "error": (
                            f"Cannot serve {self.path}: it belongs to another "
                            f"service and {reason}. Set DICTIONARY_UPSTREAM_URL to "
                            "the deployed API Gateway to forward these."
                        )
                    }
                ),
            )
            return

        request = urllib.request.Request(
            f"{self.upstream_url.rstrip('/')}{self.path}",
            data=body.encode(),
            headers={
                "Content-Type": "application/json",
                **({"x-api-key": self.upstream_key} if self.upstream_key else {}),
            },
            method="POST",
        )

        try:
            # Called through the module-level name rather than
            # `urllib.request.urlopen`, so a test can replace this one call site
            # without also replacing its own HTTP client.
            with urlopen(request, timeout=60) as upstream:
                self._respond(
                    upstream.status,
                    upstream.read().decode("utf-8"),
                    {"Content-Type": "application/json"},
                )
        except urllib.error.HTTPError as e:
            # Forward the upstream's own error verbatim; the app distinguishes
            # 400 from 500 and swallowing that would change its behaviour.
            self._respond(e.code, e.read().decode("utf-8", errors="replace"))
        except Exception as e:  # noqa: BLE001
            self._respond(502, json.dumps({"error": f"Upstream failed: {e}"}))

    def _respond(self, status: int, body: str, headers: dict | None = None) -> None:
        payload = body.encode("utf-8")
        self.send_response(status)
        for key, value in (headers or {"Content-Type": "application/json"}).items():
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, fmt: str, *args) -> None:
        logger.info("%s - %s", self.address_string(), fmt % args)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument(
        "--artifact-dir",
        default=os.environ.get("DICTIONARY_CACHE_DIR"),
        help="directory holding <language>.sqlite (default: $DICTIONARY_CACHE_DIR)",
    )
    parser.add_argument(
        "--no-proxy",
        action="store_true",
        help="reject requests for other services instead of forwarding them",
    )
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    if args.artifact_dir:
        # Set before `store` is first used, so the fetch-from-S3 path is never
        # reached and no credentials are needed.
        os.environ["DICTIONARY_CACHE_DIR"] = args.artifact_dir
        import store

        store.CACHE_DIR = args.artifact_dir

        for language in ("ru",):
            path = os.path.join(args.artifact_dir, f"{language}.sqlite")
            if os.path.exists(path):
                size = os.path.getsize(path) / 1024 / 1024
                logger.info("using %s (%.1f MB)", path, size)
            else:
                logger.warning(
                    "no artifact at %s -- lookups will 503. Build one with:\n"
                    "  cd ../dictionary-build && uv run python build.py %s"
                    " --source fixtures/%s-sample.jsonl --out %s",
                    path,
                    language,
                    language,
                    path,
                )
    elif not os.environ.get("DICTIONARY_BUCKET"):
        logger.warning(
            "neither --artifact-dir nor DICTIONARY_BUCKET is set; lookups will 503"
        )

    Handler.proxy_disabled = args.no_proxy
    Handler.upstream_url = (
        None if args.no_proxy else os.environ.get("DICTIONARY_UPSTREAM_URL")
    )
    Handler.upstream_key = os.environ.get("DICTIONARY_UPSTREAM_API_KEY")

    if Handler.upstream_url:
        logger.info("forwarding non-dictionary routes to %s", Handler.upstream_url)
    else:
        logger.info("not forwarding; only %s* is served", OWNED_PREFIX)

    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    logger.info(
        "listening on http://127.0.0.1:%d -- set API_GW_URL to this", args.port
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("stopping")
    finally:
        server.server_close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
