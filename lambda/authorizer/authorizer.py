import json
import os
import logging

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)

valid_key = os.getenv("VALID_API_KEY")


def authorize(api_key: str, expected_api_key: str) -> dict:
    if api_key == expected_api_key:
        return {"isAuthorized": True}
    return { "isAuthorized": False }


def lambda_handler(event, _):
    # Normalize header keys to lowercase for case-insensitive lookup
    headers = {k.lower(): v for k, v in event.get("headers", {}).items()}
    api_key = headers.get("x-api-key", "")

    result = authorize(api_key, valid_key)

    logger.info(json.dumps({
        "result": result,
        "reason": None,
        "error": False
    }))

    return result


if __name__ == "__main__":
    with open("event.json") as f:
        e = json.load(f)
    result = lambda_handler(e, None)
    print(json.dumps(result, indent=2))
