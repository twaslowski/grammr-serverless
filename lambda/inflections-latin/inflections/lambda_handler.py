"""
AWS Lambda handler for the Romance language verb conjugation service.

This module provides the entry point for AWS Lambda to process
verb conjugation requests for Romance languages (Italian, French,
Spanish, Portuguese, Romanian).
"""

import json
import logging

import feature_retriever
import lambda_util
from domain.inflection import Inflections
from domain.inflection_request import InflectionRequest
from inflector import InflectionError, Inflector
from model_utils import download_model_from_s3, is_model_present
from pydantic.v1 import ValidationError
from verbecc import LangCodeISO639_1

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)
logging.getLogger("verbecc").setLevel(logging.WARNING)


def handler(event, _):
    """
    AWS Lambda handler function for verb conjugation requests.

    Processes incoming API Gateway events to conjugate Romance language verbs
    in their configured mood and tense.

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

        body = json.loads(event.get("body", {}))
        try:
            request = InflectionRequest(**body)
        except ValidationError as e:
            logger.warning(
                json.dumps(
                    {
                        "success": False,
                        "error": f"Invalid request body: {str(e)}",
                    }
                )
            )
            return lambda_util.fail(400, "Invalid request body")

        # Validate that the part of speech is processable (only verbs)
        if not feature_retriever.is_word_inflectable(request.part_of_speech.value):
            logger.warning(
                json.dumps(
                    {
                        "success": False,
                        "error": f"Part of speech '{request.part_of_speech.value}' cannot be conjugated",
                    }
                )
            )
            return lambda_util.fail(
                422,
                f"Part of speech '{request.part_of_speech.value}' cannot be conjugated",
            )

        # Fetch model
        if not is_model_present(request.language):
            download_model_from_s3(request.language)

        inflector = Inflector(request.language)
        inflections = inflector.inflect(lemma=request.lemma)

        inflections_container = Inflections(
            part_of_speech=request.part_of_speech,
            lemma=request.lemma,
            inflections=inflections,
        )
        return lambda_util.ok(inflections_container.json())

    except InflectionError as e:
        # Handle expected inflection errors (unsupported language, conjugation failures)
        logger.warning(json.dumps({"success": False, "error": str(e)}))
        return lambda_util.fail(
            400, "Encountered an error when performing conjugation."
        )

    except Exception as e:
        logger.critical(
            json.dumps({"success": False, "error": str(e), "raw_event": event})
        )
        return lambda_util.fail(500, "Encountered unexpected error")
