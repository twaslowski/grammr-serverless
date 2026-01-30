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
    result = lambda_handler(event, None)
    assert result["isAuthorized"] == True

def test_no_api_key():
    event = make_event()
    print(event)
    result = lambda_handler(event, None)
    assert result["isAuthorized"] == False

def test_case_insensitive_api_key():
    event = {
        "headers": {
            "x-API-key": os.getenv("VALID_API_KEY")
        }
    }
    result = lambda_handler(event, None)
    assert result["isAuthorized"] == True

def test_incorrect_api_key():
    event = make_event("wrong-key")
    result = lambda_handler(event, None)
    assert result["isAuthorized"] == False

