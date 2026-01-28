import base64
import json
import logging

import boto3

languages = {
    "RU": {"languageCode": "ru-RU", "voiceId": "Tatyana", "engine": "standard"},
    "EN": {
        "languageCode": "en-US",
        "voiceId": "Danielle",
        "engine": "generative",
    },
    "FR": {"languageCode": "fr-FR", "voiceId": "Lea", "engine": "generative"},
    "DE": {"languageCode": "de-DE", "voiceId": "Vicki", "engine": "generative"},
    "IT": {"languageCode": "it-IT", "voiceId": "Carla", "engine": "generative"},
    "ES": {"languageCode": "es-ES", "voiceId": "Lucia", "engine": "generative"},
    "PT": {"languageCode": "pt-PT", "voiceId": "Ines", "engine": "neural"},
}

logger = logging.getLogger("root")
logger.setLevel(logging.INFO)


class Request:
    text: str
    language: str

    def __init__(self, text: str, language: str):
        if not text:
            raise ValueError("Text cannot be empty")
        language = language.upper()
        if not language or language not in languages:
            raise ValueError("Invalid language supplied")
        self.text = text
        self.language = language


def lambda_handler(event, _):
    try:
        data = json.loads(event["body"])

        try:
            parsed = Request(**data)
        except ValueError as e:
            logger.info(
                json.dumps(
                    {
                        "success": False,
                        "reason": str(e),
                        "raw_event": event,
                    }
                )
            )
            return {"statusCode": 400, "body": json.dumps({"error": str(e)})}

        text = parsed.text
        language = parsed.language

        language_code = languages.get(language)["languageCode"]
        voice = languages.get(language)["voiceId"]
        engine = languages.get(language)["engine"]

        polly_client = boto3.client("polly")
        response = polly_client.synthesize_speech(
            Text=text,
            OutputFormat="mp3",
            LanguageCode=language_code,
            VoiceId=voice,
            Engine=engine,
        )

        audio_stream = base64.b64encode(response["AudioStream"].read()).decode("utf-8")

        logger.info(
            json.dumps(
                {
                    "success": True,
                    "language": language,
                    "voice": voice,
                    "engine": engine,
                    "text_length": len(text),
                }
            )
        )
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "audio/mpeg",
                "Content-Disposition": 'inline; filename="speech.mp3"',
            },
            "body": audio_stream,
            "isBase64Encoded": True,
        }
    except Exception as e:
        logger.info(
            json.dumps(
                {
                    "success": False,
                    "reason": str(e),
                    "raw_event": event,
                }
            )
        )
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
