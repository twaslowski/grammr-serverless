import json
import logging

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


def ok(res: dict | list, context: dict) -> dict:
    context.update({"success": True, "status": 200})
    logger.info(json.dumps(context))

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(res),
    }


def fail(status: int, error: str, context: dict) -> dict:
    context.update({"success": False, "status": status})
    logger.error(json.dumps(context))

    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": error}),
    }


def check_keep_warm(event: dict[str, str]) -> dict | None:
    body = json.loads(event.get("body", "{}"))
    if body.get("keep-warm") is not None:
        return ok({"keep-warm": "success"})
    return None
