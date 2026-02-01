import json
import logging
from typing import Optional

import lambda_util
from data import Request, TranslationEngine
from translator import (AWSTranslator, DeepLTranslator, OpenAITranslator,
                        Translator)

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


def translate(
    text: str,
    source_language: str,
    target_language: str,
    context: Optional[str] = None,
    engine: TranslationEngine = TranslationEngine.DEEPL,
) -> str:
    """
    General translation function that selects the engine.
    Aiming to make use of the DeepL 500k character free tier first before switching over to AWS Translate.
    AWS Translate is comparatively expensive ($15/million characters) so we want to minimize its usage.

    :param text: Text to translate
    :param source_language: Source language code
    :param target_language: Target language code
    :param context: Optional context for disambiguation
    :param engine: TranslationEngine (default: DEEPL)
    :return: Translated text
    """
    translator = derive_appropriate_translator(engine, use_context=context is not None)
    return translator.translate(text, source_language, target_language, context)


def derive_appropriate_translator(
    translation_engine: TranslationEngine, use_context: bool = False
) -> Translator:
    if use_context:
        # Supersedes requested engine, because only OpenAITranslator can handle disambiguation via context
        return OpenAITranslator()
    else:
        if translation_engine == TranslationEngine.AWS:
            return AWSTranslator()
        elif translation_engine == TranslationEngine.DEEPL:
            return DeepLTranslator()
        else:
            raise ValueError(f"Unsupported translation engine: {translation_engine}")


def _parse_translation_engine(event: dict) -> TranslationEngine:
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
                data.get("context"),
            )
        except (ValueError, TypeError) as err:
            return lambda_util.fail(
                400, str(err), {"raw_event": event, "reason": str(err)}
            )

        translation_engine = _parse_translation_engine(event)

        translation = translate(
            parsed.text,
            parsed.source_language,
            parsed.target_language,
            parsed.context,
            translation_engine,
        )

        return lambda_util.ok(
            {"translation": translation},
            {
                "source_language": parsed.source_language,
                "target_language": parsed.target_language,
                "translation_engine": translation_engine.value,
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
