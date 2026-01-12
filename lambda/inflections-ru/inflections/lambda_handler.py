import json
import logging

from domain.inflection import Inflections
from domain.inflection_request import InflectionRequest
import lambda_util
import feature_retriever, inflector

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


def handle(event, _):
    try:
        if keep_warm_response := lambda_util.check_keep_warm(event):
            return keep_warm_response

        body = json.loads(event.get("body", {}))
        request = InflectionRequest(**body)

        features = feature_retriever.derive_features(request.part_of_speech)
        inflections = inflector.inflect(request.lemma, features)
        inflections_container = Inflections(
            part_of_speech=request.part_of_speech,
            lemma=request.lemma,
            inflections=inflections,
        )
        return lambda_util.ok(inflections_container.json())
    except Exception as e:
        logger.critical(
            json.dumps({"success": False, "error": str(e), "raw_event": event})
        )
        return lambda_util.fail(500)
