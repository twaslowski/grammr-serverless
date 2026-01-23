"""
Flask web server for the Romance language verb conjugation service.

This module provides a REST API endpoint for processing verb conjugation
requests for Romance languages (Italian, French, Spanish, Portuguese, Romanian).
"""

import json
import logging

import feature_retriever
from domain.inflection import Inflections
from domain.inflection_request import InflectionRequest
from flask import Flask, jsonify, request
from inflector import InflectionError, Inflector
from pydantic.v1 import ValidationError

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("root")

app = Flask(__name__)


@app.route("/conjugate", methods=["POST"])
def conjugate():
    """
    HTTP endpoint for verb conjugation requests.

    Processes incoming JSON requests to conjugate Romance language verbs
    in their configured mood and tense.

    Returns:
        JSON response with conjugation data or error message.
    """
    try:
        # Parse request body
        body = request.get_json(force=True, silent=True)
        if body is None:
            logger.warning(
                json.dumps({"success": False, "error": "Invalid JSON in request body"})
            )
            return jsonify({"error": "Invalid JSON in request body"}), 400

        # Validate request using Pydantic model
        try:
            inflection_request = InflectionRequest(**body)
        except ValidationError as e:
            logger.warning(
                json.dumps(
                    {
                        "success": False,
                        "error": f"Invalid request body: {str(e)}",
                    }
                )
            )
            return jsonify({"error": "Invalid request body"}), 400

        # Validate that the part of speech is processable (only verbs)
        if not feature_retriever.is_word_inflectable(
            inflection_request.part_of_speech.value
        ):
            logger.warning(
                json.dumps(
                    {
                        "success": False,
                        "error": f"Part of speech '{inflection_request.part_of_speech.value}' cannot be conjugated",
                    }
                )
            )
            return (
                jsonify(
                    {
                        "error": f"Part of speech '{inflection_request.part_of_speech.value}' cannot be conjugated"
                    }
                ),
                422,
            )

        # Perform inflection
        inflector = Inflector(inflection_request.language)
        inflections = inflector.inflect(lemma=inflection_request.lemma)

        # Create response container
        inflections_container = Inflections(
            part_of_speech=inflection_request.part_of_speech,
            lemma=inflection_request.lemma,
            inflections=inflections,
        )

        return jsonify(json.loads(inflections_container.json())), 200

    except InflectionError as e:
        # Handle expected inflection errors (unsupported language, conjugation failures)
        logger.warning(json.dumps({"success": False, "error": str(e)}))
        return (
            jsonify({"error": "Encountered an error when performing conjugation."}),
            400,
        )

    except Exception as e:
        # Handle unexpected errors
        logger.critical(
            json.dumps(
                {
                    "success": False,
                    "error": str(e),
                    "raw_request": {
                        "method": request.method,
                        "url": request.url,
                        "headers": dict(request.headers),
                        "data": request.get_data(as_text=True),
                    },
                }
            )
        )
        return jsonify({"error": "Encountered unexpected error"}), 500


@app.route("/health", methods=["GET"])
def health_check():
    """
    Health check endpoint.

    Returns:
        Simple OK response to indicate service is running.
    """
    return jsonify({"status": "ok"}), 200


if __name__ == "__main__":
    # Run the Flask development server
    # For production, use a proper WSGI server like gunicorn or uwsgi
    app.run(host="0.0.0.0", port=5000, debug=False)
