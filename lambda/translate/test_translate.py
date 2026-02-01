import json
import unittest.mock

import pytest

import translate
from translate import derive_appropriate_translator


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


def test_should_use_openai_engine_if_context_present():
    translator = derive_appropriate_translator(
        translate.Request(
            text="word",
            source_language="en",
            target_language="de",
            translation_engine=translate.TranslationEngine.DEEPL,
            context="some context",
        )
    )
    assert isinstance(translator, translate.OpenAITranslator)

def test_should_raise_exception_for_context_misuse():
    event = {"body": json.dumps({"text": "two words", "source_language": "en", "context": "hello world", "target_language": "de"})}
    response = translate.lambda_handler(event, None)
    assert response["statusCode"] == 400

def test_should_use_openai_engine_for_context():
    event = {"body": json.dumps({"text": "word", "source_language": "en", "context": "hello world", "target_language": "de"})}
    with unittest.mock.patch("translate.OpenAITranslator.translate", return_value="a translation"):
        response = translate.lambda_handler(event, None)
        assert response["statusCode"] == 200
        assert response["body"] == json.dumps({"translation": "a translation"})


testdata = [
    ("aws", translate.TranslationEngine.AWS),
    ("AWS", translate.TranslationEngine.AWS),
    ("deepl", translate.TranslationEngine.DEEPL),
    ("unknown", translate.TranslationEngine.DEEPL),
]


@pytest.mark.parametrize("engine,expected", testdata)
def test_extract_translation_engine(engine: str, expected: translate.TranslationEngine):
    event = {
        "body": json.dumps(
            {"text": "Hello", "source_language": "en", "target_language": "de"}
        ),
        "headers": {"X-Translation-Engine": engine},
    }
    translation_engine = translate._parse_translation_engine(event)
    assert translation_engine == expected
