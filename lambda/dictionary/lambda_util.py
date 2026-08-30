"""
Response helpers and structured logging.

Mirrors `lambda/inflections-ru/inflections/lambda_util.py`, with one difference:
the language is passed in rather than hard-coded, because this function serves
every language from a single deployment instead of one per language.
"""

import json
import logging

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


def ok(res: dict | list, context: dict, language: str | None = None) -> dict:
    context.update({"success": True, "status": 200, "language": language})
    logger.info(json.dumps(context, ensure_ascii=False, default=str))

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(res, ensure_ascii=False),
    }


def fail(status: int, error: str, context: dict, language: str | None = None) -> dict:
    context.update({"success": False, "status": status, "language": language})
    logger.error(json.dumps(context, ensure_ascii=False, default=str))

    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": error}, ensure_ascii=False),
    }


def is_keep_warm(event: dict) -> bool:
    """
    Whether this is a warm-up ping rather than a real lookup.

    The other services answer warm-ups with a helper that returns a response
    outright. This one only reports the fact, because the expensive part of a cold
    start here is fetching the artifact and the warm-up request is precisely the
    one that should pay for it -- so the handler primes the store first and
    responds afterwards.
    """
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return False
    return isinstance(body, dict) and body.get("keep-warm") is not None
