import json

import pytest

import translate


def test_empty_text():
    event = {
        "body": json.dumps(
            {"text": "", "source_language": "en", "target_language": "de"}
        )
    }
    response = translate.lambda_handler(event, None)
    assert response["statusCode"] == 400
    assert "Text cannot be empty" in response["body"]


def test_missing_source_language():
    event = {"body": json.dumps({"text": "Hello", "target_language": "de"})}
    response = translate.lambda_handler(event, None)
    assert response["statusCode"] == 400
    assert "Source and target languages must be provided" in response["body"]


def test_missing_target_language():
    event = {"body": json.dumps({"text": "Hello", "source_language": "en"})}
    response = translate.lambda_handler(event, None)
    assert response["statusCode"] == 400
    assert "Source and target languages must be provided" in response["body"]


def test_invalid_json():
    event = {"body": "not a json string"}
    response = translate.lambda_handler(event, None)
    assert response["statusCode"] == 400
    assert "error" in response["body"]


testdata = [
    ("aws", translate.TranslationEngine.AWS),
    ("AWS", translate.TranslationEngine.AWS),
    ("deepl", translate.TranslationEngine.DEEPL),
    ("unknown", translate.TranslationEngine.DEEPL),
]


@pytest.mark.parametrize("engine,expected", testdata)
def test_extract_translation_engine(engine: str, expected: translate.TranslationEngine):
    aws_engine = {
        "body": json.dumps(
            {"text": "Hello", "source_language": "en", "target_language": "de"}
        ),
        "headers": {"X-Translation-Engine": "aws"},
    }
    translation_engine = translate._parse_translation_engine(aws_engine)
    assert translation_engine == translate.TranslationEngine.AWS
