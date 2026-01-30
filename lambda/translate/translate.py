import json
import logging
import os
from enum import Enum

import boto3
import deepl

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


valid_languages = ["de", "en", "es", "fr", "it", "pt", "ru"]


class TranslationEngine(Enum):
    AWS = "aws"
    DEEPL = "deepl"


class Request:
    text: str
    source_language: str
    target_language: str

    def __init__(self, text: str, source_language: str, target_language: str):
        if not text:
            raise ValueError("Text cannot be empty")
        if not source_language or not target_language:
            raise ValueError("Source and target languages must be provided")
        if (
            source_language not in valid_languages
            or target_language not in valid_languages
        ):
            raise ValueError("Invalid source or target language")
        self.text = text
        self.source_language = source_language
        self.target_language = target_language


def translate(
    text: str,
    source_language: str,
    target_language: str,
    engine: TranslationEngine = TranslationEngine.DEEPL,
) -> str:
    """
    General translation function that selects the engine.
    Aiming to make use of the DeepL 500k character free tier first before switching over to AWS Translate.
    AWS Translate is comparatively expensive ($15/million characters) so we want to minimize its usage.

    :param engine:
    :param text:
    :param source_language:
    :param target_language:
    :return:
    """
    if engine == TranslationEngine.AWS:
        return aws_translate(text, source_language, target_language)
    elif engine == TranslationEngine.DEEPL:
        return deepl_translate(text, source_language, target_language)
    else:
        raise ValueError(f"Unsupported translation engine: {engine}")


def aws_translate(text: str, source_language: str, target_language: str) -> str:
    translate_client = boto3.client("translate")
    response = translate_client.translate_text(
        Text=text,
        SourceLanguageCode=source_language,
        TargetLanguageCode=target_language,
    )
    return response["TranslatedText"]


def deepl_translate(text: str, _: str, target_language: str) -> str:
    deepl_auth_key = os.environ["DEEPL_API_KEY"]
    _deepl_client = deepl.DeepLClient(deepl_auth_key)
    return _deepl_client.translate_text(text, target_lang=target_language).text


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
            )
        except (ValueError, TypeError) as err:
            logger.info(
                json.dumps(
                    {
                        "success": False,
                        "reason": str(err),
                        "raw_event": event,
                    }
                )
            )
            return {"statusCode": 400, "body": json.dumps({"error": str(err)})}

        translation_engine = _parse_translation_engine(event)

        translation = translate(
            parsed.text,
            parsed.source_language,
            parsed.target_language,
            translation_engine,
        )

        logger.info(
            json.dumps(
                {
                    "success": True,
                    "source_language": parsed.source_language,
                    "target_language": parsed.target_language,
                    "text_length": len(parsed.text),
                    "translation_engine": translation_engine.value,
                }
            )
        )
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "translation": translation,
                }, ensure_ascii=False
            ),
        }
    except Exception as err:
        logger.info(
            json.dumps(
                {
                    "success": False,
                    "reason": str(err),
                    "raw_event": event,
                    "source_language": event.get("source_language"),
                    "target_language": event.get("target_language"),
                }
            )
        )
        return {"statusCode": 500, "body": json.dumps({"error": str(err)})}


if __name__ == "__main__":
    with open("event.json") as f:
        e = json.load(f)
    result = lambda_handler(e, None)
    print(json.dumps(result, indent=2))
