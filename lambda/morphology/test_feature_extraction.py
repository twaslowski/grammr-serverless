import spacy

import feature_extraction
from domain import Feature

nlp = spacy.load("de_core_news_sm")


def test_should_extract_features():
    text = "Der schnelle braune Fuchs springt über den faulen Hund."
    doc = nlp(text)

    der = doc[0]
    features = feature_extraction.extract_features(der)
    assert find_feature_by_type("case", features).value == "NOM"
    assert find_feature_by_type("number", features).value == "SING"
    assert find_feature_by_type("gender", features).value == "MASC"

    springt = doc[4]
    features = feature_extraction.extract_features(springt)
    assert find_feature_by_type("person", features).value == "3"
    assert find_feature_by_type("number", features).value == "SING"
    assert find_feature_by_type("tense", features).value == "PRES"


def find_feature_by_type(feature_type: str, features: list[Feature]) -> Feature | None:
    for feature in features:
        if feature.type.lower() == feature_type.lower():
            return feature
    return None
