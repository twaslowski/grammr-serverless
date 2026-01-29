"""
AWS Lambda handler for the Russian inflection service.

This module provides the entry point for AWS Lambda to process
inflection requests for Russian words.
"""

import json
import logging

import feature_retriever
import lambda_util
from domain.inflection_request import InflectionRequest
from inflector import InflectionError, Inflector
from pydantic.v1 import ValidationError

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)

# Create a singleton inflector instance with default confidence threshold
_inflector = Inflector()


def handler(event, _):
    """
    AWS Lambda handler function for inflection requests.

    Processes incoming API Gateway events to inflect Russian words
    based on their part of speech.

    Args:
        event: AWS Lambda event object containing the HTTP request.
        _: AWS Lambda context object (unused).

    Returns:
        HTTP response dict with status code, headers, and body.
    """
    try:
        # Handle keep-warm requests for Lambda optimization
        if keep_warm_response := lambda_util.check_keep_warm(event):
            return keep_warm_response

        try:
            body = json.loads(event.get("body", {}))
            request = InflectionRequest(**body)
        except ValidationError | json.JSONDecoder as e:
            logger.warning(
                json.dumps(
                    {
                        "success": False,
                        "error": f"Invalid request body: {str(e)}",
                    }
                )
            )
            return lambda_util.fail(400, "Invalid request body")

        # Generate all possible feature combinations for the POS
        features = feature_retriever.derive_features(request.part_of_speech)

        # Inflect the word with all feature combinations
        inflections = _inflector.inflect(
            word=request.lemma,
            features=features,
            expected_pos=request.part_of_speech,
        )

        logger.info(json.dumps(
            {
                "success": True,
                "word": request.lemma,
                "part_of_speech": request.part_of_speech.name,
                "detected_part_of_speech": inflections._parse.tag.POS.name,
                "confidence": inflections._parse.score,
                "inflections_count": len(inflections.inflected_forms),
            }
        ))
        return lambda_util.ok(inflections.json())

    except InflectionError as e:
        # Handle expected inflection errors (low confidence, POS mismatch)
        logger.warning(
            json.dumps(
                {
                    "success": False,
                    "error": str(e),
                    "expected_pos": e.expected_pos,
                    "word": e.word,
                    "confidence": e.parse.score,
                    "detected_pos": e.parse.tag.POS,
                }
            )
        )
        return lambda_util.fail(400, "Encountered an error when performing inflection.")

    except Exception as e:
        logger.critical(
            json.dumps({"success": False, "error": str(e), "raw_event": event})
        )
        return lambda_util.fail(500, "Encountered unexpected error")
