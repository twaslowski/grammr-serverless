"""
Tests for the handler's HTTP contract.

The status codes are the interesting part. `POST /api/v1/inflections` turns a
word it cannot handle into a 400 that the UI renders as an error card; a
dictionary must answer "no such word" and "this word has no table" with a 200,
because both are results.
"""

import json

from conftest import event
from lambda_handler import handler


def call(body: dict | str | None, path: str = "/dictionary/ru") -> tuple[int, dict]:
    payload = body if isinstance(body, str) or body is None else json.dumps(body)
    response = handler(event(path, payload), None)
    return response["statusCode"], json.loads(response["body"])


class TestSuccessfulLookup:
    def test_a_known_word_returns_entries(self):
        status, body = call({"query": "стол"})
        assert status == 200
        assert body["query"] == "стол"
        assert len(body["entries"]) == 1

    def test_the_response_carries_its_own_attribution(self):
        """CC BY-SA obliges attribution, so the payload has to be able to say so."""
        _, body = call({"query": "стол"})
        assert body["attribution"]["license"] == "CC BY-SA 4.0"
        assert "wiktextract" in body["attribution"]["source"]

    def test_an_unknown_word_is_a_200_with_no_entries(self):
        status, body = call({"query": "несуществующее"})
        assert status == 200
        assert body["entries"] == []

    def test_an_uninflected_word_is_a_200_with_a_null_paradigm(self):
        status, body = call({"query": "быстро"})
        assert status == 200
        assert body["entries"][0]["inflections"] is None

    def test_an_inflected_query_does_not_resolve_by_itself(self):
        """
        Lemma resolution is the BFF's job, via the morphology service. The Lambda
        matching only headwords is what keeps that boundary honest.
        """
        _, body = call({"query": "шёл"})
        assert body["entries"] == []

    def test_a_pos_hint_narrows_the_result(self):
        _, body = call({"query": "стать", "pos": "NOUN"})
        assert [e["partOfSpeech"] for e in body["entries"]] == ["NOUN"]


class TestErrors:
    def test_an_unsupported_language_is_a_404(self):
        status, body = call({"query": "Tisch"}, path="/dictionary/de")
        assert status == 404
        assert "de" in body["error"]

    def test_an_empty_query_is_a_400(self):
        status, body = call({"query": ""})
        assert status == 400
        assert "empty" in body["error"].lower()

    def test_malformed_json_is_a_400_not_a_500(self):
        """
        The regression `lambda/inflections-ru` has: its handler means to return
        400 here but its `except` clause cannot match, so it 500s instead.
        """
        status, body = call("{not json")
        assert status == 400
        assert "JSON" in body["error"]

    def test_a_missing_body_is_a_400(self):
        status, _ = call(None)
        assert status == 400

    def test_an_unavailable_artifact_is_a_503(self, monkeypatch):
        import store

        monkeypatch.setattr(store, "CACHE_DIR", "/tmp/definitely-not-here")
        monkeypatch.delenv(store.BUCKET_ENV, raising=False)
        store.reset()

        status, body = call({"query": "стол"})
        assert status == 503
        assert "unavailable" in body["error"].lower()


class TestKeepWarm:
    def test_a_warm_up_ping_succeeds(self):
        status, body = call({"keep-warm": True})
        assert status == 200
        assert body == {"keep-warm": "success"}

    def test_a_warm_up_ping_primes_the_artifact(self, monkeypatch):
        """
        Fetching the SQLite file is the entire cost of a cold start here, so a
        warm-up that returned before touching it would report success and leave
        the next real request to pay.
        """
        import store

        connected: list[str] = []
        original = store.connect
        monkeypatch.setattr(
            store, "connect", lambda language: (connected.append(language), original(language))[1]
        )

        call({"keep-warm": True})
        assert connected == ["ru"]

    def test_a_warm_up_ping_on_an_unsupported_language_is_still_a_404(self):
        status, _ = call({"keep-warm": True}, path="/dictionary/de")
        assert status == 404
