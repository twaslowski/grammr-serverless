"""
Tests for the local development shim.

Dev tooling, but worth testing the two things that would waste someone's
afternoon if wrong: that a request reaches the handler in the event shape it
expects, and that requests for the *other* services are forwarded rather than
answered with a dictionary 404. A shim that silently swallowed
`/morphology/ru` would break the fallback chain in a way that looks like a bug
in the chain.
"""

import io
import json
import threading
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

import pytest

import local_server


@pytest.fixture
def server(artifact_dir, monkeypatch):
    """A shim on an ephemeral port, serving the fixture-built artifact."""
    import store

    monkeypatch.setattr(store, "CACHE_DIR", str(artifact_dir))
    store.reset()

    monkeypatch.setattr(local_server.Handler, "upstream_url", None)
    monkeypatch.setattr(local_server.Handler, "upstream_key", None)
    monkeypatch.setattr(local_server.Handler, "proxy_disabled", False)

    httpd = ThreadingHTTPServer(("127.0.0.1", 0), local_server.Handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{httpd.server_address[1]}"
    finally:
        httpd.shutdown()
        httpd.server_close()
        thread.join(timeout=5)
        store.reset()


def post(base: str, path: str, body: str) -> tuple[int, dict]:
    request = urllib.request.Request(
        f"{base}{path}",
        data=body.encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            return response.status, json.loads(response.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


class TestDictionaryRoutes:
    def test_a_lookup_reaches_the_handler(self, server):
        status, body = post(server, "/dictionary/ru", json.dumps({"query": "стол"}))
        assert status == 200
        assert body["entries"][0]["lemma"] == "стол"

    def test_the_language_is_read_from_the_path(self, server):
        """
        The handler takes the language from `rawPath`, so the shim has to put the
        request path there rather than only in a query string or header.
        """
        status, body = post(server, "/dictionary/de", json.dumps({"query": "Tisch"}))
        assert status == 404
        assert "de" in body["error"]

    def test_an_unknown_word_is_still_a_200(self, server):
        status, body = post(server, "/dictionary/ru", json.dumps({"query": "xyz123"}))
        assert status == 200
        assert body["entries"] == []

    def test_a_malformed_body_is_a_400(self, server):
        status, _ = post(server, "/dictionary/ru", "{not json")
        assert status == 400

    def test_keep_warm_works_against_a_staged_artifact(self, server):
        status, body = post(server, "/dictionary/ru", json.dumps({"keep-warm": True}))
        assert status == 200
        assert body == {"keep-warm": "success"}

    def test_health_is_a_get(self, server):
        with urllib.request.urlopen(f"{server}/health", timeout=10) as response:
            assert json.loads(response.read()) == {"status": "ok"}


class TestForwarding:
    def test_another_service_is_not_answered_as_a_dictionary_404(self, server):
        """
        `/morphology/ru` is not this function's, and answering it would break the
        lookup chain's lemma resolution in a way that looks like a chain bug.
        """
        status, body = post(server, "/morphology/ru", json.dumps({"text": "стол"}))
        assert status == 502
        assert "another" in body["error"]

    def test_the_error_names_the_missing_upstream(self, server):
        _, body = post(server, "/translate", json.dumps({"text": "стол"}))
        assert "DICTIONARY_UPSTREAM_URL" in body["error"]

    def test_no_proxy_is_reported_as_the_reason_when_it_is(
        self, server, monkeypatch
    ):
        # Otherwise the message tells you to set a variable you deliberately
        # overrode on the command line.
        monkeypatch.setattr(local_server.Handler, "proxy_disabled", True)
        _, body = post(server, "/morphology/ru", json.dumps({"text": "стол"}))
        assert "--no-proxy" in body["error"]

    def test_a_forwarded_request_carries_the_api_key(self, server, monkeypatch):
        seen: dict = {}

        class FakeResponse:
            status = 200

            def read(self):
                return b'{"ok": true}'

            def __enter__(self):
                return self

            def __exit__(self, *_):
                return False

        def fake_urlopen(request, timeout=None):
            seen["url"] = request.full_url
            seen["key"] = request.get_header("X-api-key")
            seen["body"] = request.data
            return FakeResponse()

        monkeypatch.setattr(local_server.Handler, "upstream_url", "https://gw.test")
        monkeypatch.setattr(local_server.Handler, "upstream_key", "secret")
        # `local_server.urlopen`, not `urllib.request.urlopen`: patching the
        # latter would also replace this test's own client.
        monkeypatch.setattr(local_server, "urlopen", fake_urlopen)

        status, body = post(server, "/morphology/ru", json.dumps({"text": "стол"}))
        assert status == 200
        assert body == {"ok": True}
        assert seen["url"] == "https://gw.test/morphology/ru"
        assert seen["key"] == "secret"
        assert json.loads(seen["body"]) == {"text": "стол"}

    def test_an_upstream_error_status_is_passed_through(self, server, monkeypatch):
        # The app branches on 400 vs 500, so flattening upstream failures into a
        # single status would change its behaviour.
        def fake_urlopen(request, timeout=None):
            raise urllib.error.HTTPError(
                request.full_url,
                400,
                "Bad Request",
                {},
                io.BytesIO(b'{"error": "upstream said no"}'),
            )

        monkeypatch.setattr(local_server.Handler, "upstream_url", "https://gw.test")
        monkeypatch.setattr(local_server, "urlopen", fake_urlopen)

        status, body = post(server, "/morphology/ru", "{}")
        assert status == 400
        assert body == {"error": "upstream said no"}

    def test_an_upstream_that_cannot_be_reached_is_a_502(self, server, monkeypatch):
        def fake_urlopen(request, timeout=None):
            raise OSError("connection refused")

        monkeypatch.setattr(local_server.Handler, "upstream_url", "https://gw.test")
        monkeypatch.setattr(local_server, "urlopen", fake_urlopen)

        status, body = post(server, "/morphology/ru", "{}")
        assert status == 502
        assert "connection refused" in body["error"]
