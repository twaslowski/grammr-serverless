import json
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
