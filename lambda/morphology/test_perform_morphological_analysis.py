import json
import unittest.mock

import lambda_handler
from domain import Feature, MorphologicalAnalysis, TokenMorphology
from test_feature_extraction import find_feature_by_type
import feature_extraction


def test_valid_request():
    """Test a valid morphological analysis request."""
    event = {"body": json.dumps({"text": "Hello world"})}

    mock_analysis = MorphologicalAnalysis(
        text="Hello world",
        tokens=[
            TokenMorphology(text="Hello", lemma="hello", pos="INTJ", features=[]),
            TokenMorphology(text="world", lemma="world", pos="NOUN", features=[]),
        ],
    )

    with unittest.mock.patch(
        "analysis_service.perform_analysis", return_value=mock_analysis
    ):
        response = lambda_handler.handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["text"] == "Hello world"
        assert len(body["tokens"]) == 2
        assert body["tokens"][0]["text"] == "Hello"
        assert body["tokens"][1]["text"] == "world"


def test_empty_text():
    """Test request with empty text field."""
    event = {"body": json.dumps({"text": ""})}
    response = lambda_handler.handler(event, None)
    assert response["statusCode"] == 400


def test_missing_text_field():
    """Test request without required text field."""
    event = {"body": json.dumps({})}
    response = lambda_handler.handler(event, None)
    assert response["statusCode"] == 400


def test_invalid_json():
    """Test request with invalid JSON in body."""
    event = {"body": "not a json string"}
    response = lambda_handler.handler(event, None)
    assert response["statusCode"] == 400


def test_missing_body():
    """Test request without body field."""
    event = {}
    response = lambda_handler.handler(event, None)
    assert response["statusCode"] == 400


def test_keep_warm_request():
    """Test keep-warm functionality."""
    event = {"body": json.dumps({"keep-warm": True})}
    response = lambda_handler.handler(event, None)
    assert response["statusCode"] == 200
    assert json.loads(response["body"]) == {"keep-warm": "success"}


def test_exception_in_analysis_service():
    """Test error handling when analysis service raises an exception."""
    event = {"body": json.dumps({"text": "test"})}

    with unittest.mock.patch(
        "analysis_service.perform_analysis", side_effect=Exception("Analysis error")
    ):
        response = lambda_handler.handler(event, None)
        assert response["statusCode"] == 500


def test_multiword_phrase():
    """Test analysis of a multi-word phrase."""
    event = {"body": json.dumps({"text": "The quick brown fox"})}

    mock_analysis = MorphologicalAnalysis(
        text="The quick brown fox",
        tokens=[
            TokenMorphology(text="The", lemma="the", pos="DET", features=[]),
            TokenMorphology(text="quick", lemma="quick", pos="ADJ", features=[]),
            TokenMorphology(text="brown", lemma="brown", pos="ADJ", features=[]),
            TokenMorphology(
                text="fox",
                lemma="fox",
                pos="NOUN",
                features=[Feature(type="number", value="SING")],
            ),
        ],
    )

    with unittest.mock.patch(
        "analysis_service.perform_analysis", return_value=mock_analysis
    ):
        response = lambda_handler.handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert len(body["tokens"]) == 4
        assert body["tokens"][3]["features"][0]["type"] == "number"


def test_text_with_punctuation():
    """Test analysis of text with punctuation."""
    event = {"body": json.dumps({"text": "Hello, world!"})}

    mock_analysis = MorphologicalAnalysis(
        text="Hello, world!",
        tokens=[
            TokenMorphology(text="Hello", lemma="hello", pos="INTJ", features=[]),
            TokenMorphology(text=",", lemma=",", pos="PUNCT", features=[]),
            TokenMorphology(text="world", lemma="world", pos="NOUN", features=[]),
            TokenMorphology(text="!", lemma="!", pos="PUNCT", features=[]),
        ],
    )

    with unittest.mock.patch(
        "analysis_service.perform_analysis", return_value=mock_analysis
    ):
        response = lambda_handler.handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert len(body["tokens"]) == 4


def test_single_word():
    """Test analysis of a single word."""
    event = {"body": json.dumps({"text": "word"})}

    mock_analysis = MorphologicalAnalysis(
        text="word",
        tokens=[TokenMorphology(text="word", lemma="word", pos="NOUN", features=[])],
    )

    with unittest.mock.patch(
        "analysis_service.perform_analysis", return_value=mock_analysis
    ):
        response = lambda_handler.handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert len(body["tokens"]) == 1
        assert body["tokens"][0]["text"] == "word"


def test_text_with_special_characters():
    """Test analysis of text with special characters."""
    event = {"body": json.dumps({"text": "test@example.com"})}

    mock_analysis = MorphologicalAnalysis(
        text="test@example.com",
        tokens=[
            TokenMorphology(
                text="test@example.com", lemma="test@example.com", pos="X", features=[]
            )
        ],
    )

    with unittest.mock.patch(
        "analysis_service.perform_analysis", return_value=mock_analysis
    ):
        response = lambda_handler.handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["tokens"][0]["text"] == "test@example.com"


def test_long_text():
    """Test analysis of longer text."""
    long_text = " ".join(["word"] * 100)
    event = {"body": json.dumps({"text": long_text})}

    mock_tokens = [
        TokenMorphology(text="word", lemma="word", pos="NOUN", features=[])
        for _ in range(100)
    ]
    mock_analysis = MorphologicalAnalysis(text=long_text, tokens=mock_tokens)

    with unittest.mock.patch(
        "analysis_service.perform_analysis", return_value=mock_analysis
    ):
        response = lambda_handler.handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert len(body["tokens"]) == 100


def test_unicode_text():
    """Test analysis of unicode text."""
    event = {"body": json.dumps({"text": "Привет мир"})}

    mock_analysis = MorphologicalAnalysis(
        text="Привет мир",
        tokens=[
            TokenMorphology(text="Привет", lemma="привет", pos="NOUN", features=[]),
            TokenMorphology(text="мир", lemma="мир", pos="NOUN", features=[]),
        ],
    )

    with unittest.mock.patch(
        "analysis_service.perform_analysis", return_value=mock_analysis
    ):
        response = lambda_handler.handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert body["tokens"][0]["text"] == "Привет"
        assert body["tokens"][1]["text"] == "мир"


def test_whitespace_only():
    """Test analysis of whitespace-only text."""
    event = {"body": json.dumps({"text": "   "})}

    mock_analysis = MorphologicalAnalysis(text="   ", tokens=[])

    with unittest.mock.patch(
        "analysis_service.perform_analysis", return_value=mock_analysis
    ):
        response = lambda_handler.handler(event, None)
        assert response["statusCode"] == 400


def test_tokens_with_features():
    """Test analysis with tokens containing morphological features."""
    event = {"body": json.dumps({"text": "Der Hund"})}

    response = lambda_handler.handler(event, None)

    assert response["statusCode"] == 200
    body = json.loads(response["body"])

    assert len(body["tokens"]) == 2
    assert body["tokens"][0]["text"] == "Der"
    assert body["tokens"][1]["text"] == "Hund"

    case = list(filter(lambda f: f["type"] == "case", body["tokens"][0]["features"]))[0]
    assert case["value"] == "NOM"


def test_body_is_none():
    """Test handling of None body."""
    event = {"body": None}
    response = lambda_handler.handler(event, None)
    assert response["statusCode"] == 500


def test_critical_exception_before_try_block():
    """Test critical exception handling."""
    # Simulate an exception in the outer try block
    event = None
    response = lambda_handler.handler(event, None)
    assert response["statusCode"] == 500


def test_response_structure():
    """Test that response has correct structure."""
    event = {"body": json.dumps({"text": "test"})}

    response = lambda_handler.handler(event, None)

    assert "statusCode" in response
    assert "headers" in response
    assert "body" in response
    assert response["headers"]["Content-Type"] == "application/json"


def test_incorrect_field_validation_error():
    """Test handling of Pydantic validation error."""
    event = {"body": json.dumps({"wrong_field": "value"})}
    response = lambda_handler.handler(event, None)
    assert response["statusCode"] == 400


def test_numbers_in_text():
    """Test analysis of text with numbers."""
    event = {"body": json.dumps({"text": "I have 5 apples"})}

    result = lambda_handler.handler(event, None)

    assert result["statusCode"] == 200
    body = json.loads(result["body"])
    assert body["text"] == "I have 5 apples"
    assert len(body["tokens"]) == 4


def test_nested_json_in_body():
    """Test handling of extra nested data in body."""
    event = {"body": json.dumps({"text": "test", "extra_data": {"nested": "value"}})}

    mock_analysis = MorphologicalAnalysis(
        text="test",
        tokens=[TokenMorphology(text="test", lemma="test", pos="NOUN", features=[])],
    )

    with unittest.mock.patch(
        "analysis_service.perform_analysis", return_value=mock_analysis
    ):
        response = lambda_handler.handler(event, None)
        # Should succeed if Pydantic ignores extra fields
        assert response["statusCode"] == 200


def test_empty_token_list():
    """Test analysis that returns no tokens."""
    event = {"body": json.dumps({"text": "..."})}

    mock_analysis = MorphologicalAnalysis(text="...", tokens=[])

    with unittest.mock.patch(
        "analysis_service.perform_analysis", return_value=mock_analysis
    ):
        response = lambda_handler.handler(event, None)
        assert response["statusCode"] == 200
        body = json.loads(response["body"])
        assert len(body["tokens"]) == 0
