import json
import os

from authorizer import lambda_handler


def make_event(api_key=None):
    headers = {}
    if api_key is not None:
        headers["x-api-key"] = api_key
    return {"headers": headers}

def test_correct_api_key():
    correct_key = os.getenv("VALID_API_KEY")

    event = make_event(correct_key)
    result = json.loads(lambda_handler(event, None))
    assert result["Statement"][0]["Effect"] == "Allow"

def test_no_api_key():
    event = make_event()
    print(event)
    result = json.loads(lambda_handler(event, None))
    assert result["Statement"][0]["Effect"] == "Deny"

def test_case_insensitive_api_key():
    event = {
        "headers": {
            "x-API-key": os.getenv("VALID_API_KEY")
        }
    }
    result = json.loads(lambda_handler(event, None))
    # Should be Deny if case-sensitive, Allow if case-insensitive
    # Current implementation is case-sensitive, so expect Deny
    assert result["Statement"][0]["Effect"] == "Allow"

def test_incorrect_api_key():
    event = make_event("wrong-key")
    result = json.loads(lambda_handler(event, None))
    assert result["Statement"][0]["Effect"] == "Deny"

