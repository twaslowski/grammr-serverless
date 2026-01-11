import json
import logging

from morphology.domain.analysis_request import AnalysisRequest
from morphology.service import analysis_service
from morphology.lambda_util import ok, fail, check_keep_warm


# configure logging
logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


def handler(event, _) -> dict:
    if keep_warm_response := check_keep_warm(event):
        return keep_warm_response
    try:
        body = json.loads(event.get("body", {}))
        body = AnalysisRequest(**body)
        analysis = analysis_service.perform_analysis(body)
        logger.info(json.dumps({
            "success": True,
            "phrase": body.phrase,
            "num_tokens": len(analysis.tokens),
            "raw_event": event
        }))
        return ok(analysis.model_dump())
    except Exception as e:
        logger.error(json.dumps({
            "success": False,
            "error": str(e),
            "raw_event": event
        }))
        return fail(500)
