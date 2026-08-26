"""
Request-deserialization tests for the Russian inflection handler.

The 400 responses the OpenAPI spec documents used to come back as 500s: the
handler caught `pydantic.v1.ValidationError` while the models are Pydantic v2,
and `except A | B` is not valid before Python 3.14. These pin both.
"""

import json

import pytest

from lambda_handler import handler


def invoke(body):
    return handler({"body": body}, None)


def error_of(response):
    return json.loads(response["body"])["error"]


class TestMalformedRequests:
    @pytest.mark.parametrize(
        "body",
        [
            "not json at all",
            "{",
            '{"lemma": "кот", "pos": }',
        ],
        ids=["plain-text", "truncated", "invalid-value"],
    )
    def test_unparseable_body_is_a_user_error(self, body):
        response = invoke(body)

        assert response["statusCode"] == 400
        assert error_of(response) == "Invalid request body"

    @pytest.mark.parametrize(
        "body",
        [
            {},
            {"lemma": "кот"},
            {"pos": "NOUN"},
            {"lemma": "кот", "pos": "NOT_A_POS"},
            {"lemma": "кот", "part_of_speech": "NOUN"},
        ],
        ids=["empty", "no-pos", "no-lemma", "unknown-pos", "aliased-field"],
    )
    def test_body_that_is_not_an_inflection_request_is_a_user_error(self, body):
        response = invoke(json.dumps(body))

        assert response["statusCode"] == 400
        assert error_of(response) == "Invalid request body"


class TestKeepWarm:
    def test_keep_warm_ping_is_answered(self):
        response = invoke(json.dumps({"keep-warm": True}))

        assert response["statusCode"] == 200
        assert json.loads(response["body"]) == {"keep-warm": "success"}

    def test_unparseable_body_is_not_mistaken_for_a_ping(self):
        # check_keep_warm used to raise here, turning a 400 into a 500.
        assert invoke("{")["statusCode"] == 400
