import json
import logging

import lambda_util
from data import Request, TranslationEngine
from translator import (AWSTranslator, DeepLTranslator, OpenAITranslator,
                        Translator)

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


def derive_appropriate_translator(
    request: Request
) -> Translator:
    if request.context:
        # Supersedes requested engine, because only OpenAITranslator can handle disambiguation via context
        return OpenAITranslator()
    else:
        if request.translation_engine == TranslationEngine.AWS:
            return AWSTranslator()
        elif request.translation_engine == TranslationEngine.DEEPL:
            return DeepLTranslator()
        else:
            raise ValueError(f"Unsupported translation engine: {request.translation_engine}")


def _parse_translation_engine(event: dict) -> TranslationEngine:
    """
    Parse translation engine from event headers.
    NOTE: Requesting a translation engine does NOT guarantee that it will be used.
    In particular, when context is provided, OpenAITranslator will be used regardless of the requested engine.

    :param event: Lambda event containing payload and headers
    :return: Translation Engine. Defaults to TranslationEngine.DEEPL if not specified or invalid.
    """
    translation_engine_header = (
        event.get("headers", {}).get("X-Translation-Engine", "deepl").lower()
    )

    try:
        translation_engine = TranslationEngine(translation_engine_header)
    except ValueError:
        translation_engine = TranslationEngine.DEEPL
    return translation_engine


def lambda_handler(event, _) -> dict:
    try:
        try:
            data = json.loads(event["body"])
            parsed = Request(
                data.get("text"),
                data.get("source_language"),
                data.get("target_language"),
                _parse_translation_engine(event),
                data.get("context"),
            )
        except (ValueError, TypeError) as err:
            return lambda_util.fail(
                400, str(err), {"raw_event": event, "reason": str(err)}
            )

        translator = derive_appropriate_translator(parsed)

        translation = translator.translate(
            parsed.text,
            parsed.source_language,
            parsed.target_language,
            parsed.context,
        )

        return lambda_util.ok(
            {"translation": translation},
            {
                "source_language": parsed.source_language,
                "target_language": parsed.target_language,
                "translator": translator.__class__.__name__,
                "text_length": len(parsed.text),
            },
        )
    except Exception as err:
        return lambda_util.fail(500, str(err), {"raw_event": event, "reason": str(err)})


if __name__ == "__main__":
    with open("event.json") as f:
        e = json.load(f)
    result = lambda_handler(e, None)
    print(json.dumps(result, indent=2))
