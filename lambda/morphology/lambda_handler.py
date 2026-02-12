import json
import logging
from json import JSONDecodeError

import analysis_service
import lambda_util
from domain import AnalysisRequest

# configure logging
logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


def handler(event, _) -> dict:
    try:
        try:
            if keep_warm_response := lambda_util.check_keep_warm(event):
                return keep_warm_response
        except (ValueError, JSONDecodeError):
            # Continue to main processing if the body is not valid JSON or doesn't contain "keep-warm"
            pass

        try:
            body = json.loads(event.get("body", {}))
            logger.info(body)
            parsed = AnalysisRequest(body.get("text"))
        except (TypeError, ValueError, JSONDecodeError) as err:
            return lambda_util.fail(
                400, f"Invalid request body: {err}", {"raw_event": event}
            )

        analysis = analysis_service.perform_analysis(parsed)
        return lambda_util.ok(
            analysis.model_dump(),
            {
                "text": parsed.text,
                "num_tokens": len(analysis.tokens),
                "raw_event": event,
            },
        )
    except Exception as e:
        return lambda_util.fail(
            500,
            str(e),
            {
                "raw_event": event,
            },
        )
