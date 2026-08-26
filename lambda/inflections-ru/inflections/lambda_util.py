import json
import logging

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


def ok(res: dict | list, context: dict) -> dict:
    context.update({"success": True, "status": 200, "language": "ru"})
    logger.info(json.dumps(context, ensure_ascii=False))

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(res),
    }


def fail(status: int, error: str, context: dict) -> dict:
    context.update({"success": False, "status": status, "language": "ru"})
    logger.error(json.dumps(context, ensure_ascii=False))

    return {
        "statusCode": status,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"error": error}),
    }


def check_keep_warm(event: dict[str, str]) -> dict | None:
    # A body we cannot parse is not a keep-warm ping. Leave it to the handler,
    # which answers 400 for it; raising here would surface as a 500.
    try:
        body = json.loads(event.get("body", "{}"))
    except json.JSONDecodeError:
        return None

    if isinstance(body, dict) and body.get("keep-warm") is not None:
        return ok({"keep-warm": "success"}, {})
    return None
