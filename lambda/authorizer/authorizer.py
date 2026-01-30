import json
import os
import logging
import copy

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

valid_key = os.getenv("VALID_API_KEY")
execute_arn = os.getenv("EXECUTE_API_ARN")

policy_template = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "execute-api:Invoke",
            "Effect": "Deny",
            "Resource": f"{execute_arn}/*",
        }
    ],
}


def authorize(api_key: str, expected_api_key: str, template: dict) -> dict:
    if api_key == expected_api_key:
        print(f"{api_key} {expected_api_key}")
        template["Statement"][0]["Effect"] = "Allow"
    return template


def lambda_handler(event, _):
    if not execute_arn:
        logger.critical(json.dumps({
            "result": "deny",
            "error": "EXECUTE_API_ARN environment variable is not set",
        }))
        return json.dumps(policy_template)

    # Normalize header keys to lowercase for case-insensitive lookup
    headers = {k.lower(): v for k, v in event.get("headers", {}).items()}
    api_key = headers.get("x-api-key", "")

    # Use deepcopy to avoid mutating the global template
    policy = authorize(api_key, valid_key, copy.deepcopy(policy_template))

    logger.info(json.dumps({
        "result": policy["Statement"][0]["Effect"].lower(),
        "reason": None,
        "error": False
    }))

    return json.dumps(policy)


if __name__ == "__main__":
    with open("event.json") as f:
        e = json.load(f)
    result = lambda_handler(e, None)
    print(json.dumps(result, indent=2))
