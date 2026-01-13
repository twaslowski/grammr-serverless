"""
Utility functions for AWS Lambda HTTP responses.

Provides helper functions for creating standardized API Gateway responses.
"""

import json
from typing import Optional


def ok(res: dict | list) -> dict:
    """
    Create a successful HTTP 200 response.

    Args:
        res: The response body to serialize as JSON.

    Returns:
        API Gateway-compatible response dict.
    """
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(res),
    }


def fail(status: int) -> dict:
    """
    Create an error HTTP response.

    Args:
        status: HTTP status code for the error response.

    Returns:
        API Gateway-compatible error response dict.
    """
    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({}),
    }


def check_keep_warm(event: dict[str, str]) -> Optional[dict]:
    """
    Check if this is a keep-warm request and return appropriate response.

    Keep-warm requests are used to prevent Lambda cold starts by
    periodically invoking the function.

    Args:
        event: The Lambda event to check.

    Returns:
        A success response if this is a keep-warm request, None otherwise.
    """
    body = json.loads(event.get("body", "{}"))
    if body.get("keep-warm") is not None:
        return ok({"keep-warm": "success"})
    return None
