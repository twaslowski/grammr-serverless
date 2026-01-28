import pytest

from lambda_handler import extract_language


def test_should_extract_language():
    event = {"path": "/prod/inflections/it"}
    assert extract_language(event) == "it"


def test_should_raise_exception():
    event = {}
    with pytest.raises(ValueError):
        extract_language(event)
