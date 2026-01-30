import json
import logging
import boto3

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


valid_languages = ["de", "en", "es", "fr", "it", "pt", "ru"]


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

        translate_client = boto3.client("translate")
        response = translate_client.translate_text(
            Text=parsed.text,
            SourceLanguageCode=parsed.source_language,
            TargetLanguageCode=parsed.target_language,
        )
        logger.info(
            json.dumps(
                {
                    "success": True,
                    "source_language": parsed.source_language,
                    "target_language": parsed.target_language,
                    "text_length": len(parsed.text),
                }
            )
        )
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "translation": response["TranslatedText"],
                }
            ),
        }
    except Exception as err:
        logger.info(
            json.dumps(
                {
                    "success": False,
                    "reason": str(err),
                    "raw_event": event,
                }
            )
        )
        return {"statusCode": 500, "body": json.dumps({"error": str(err)})}


if __name__ == "__main__":
    with open("event.json") as f:
        e = json.load(f)
    result = lambda_handler(e, None)
    print(json.dumps(result, indent=2))
