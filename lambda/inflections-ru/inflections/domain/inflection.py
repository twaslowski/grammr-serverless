"""
Inflection domain models.

This module defines the data structures for representing inflected words
and collections of inflections.
"""

from pydantic import BaseModel
from pymorphy3.analyzer import Parse

from .feature import Feature
from .part_of_speech import PartOfSpeech


class Inflection(BaseModel):
    """
    Represents a single inflected form of a word.

    Attributes:
        lemma: The dictionary/base form of the word.
        inflected: The inflected form of the word.
        features: Set of grammatical features applied to produce this inflection.
    """

    lemma: str
    inflected: str
    features: set[Feature]

    def json(self, **kwargs) -> dict:
        """Serialize the inflection to a JSON-compatible dictionary."""
        return {
            "lemma": self.lemma,
            "inflected": self.inflected,
            "features": [feature.json() for feature in self.features],
        }


class Inflections(BaseModel):
    """
    Container for all inflections of a word.

    Attributes:
        part_of_speech: The part of speech of the word.
        lemma: The dictionary/base form of the word.
        inflections: List of all inflected forms.
    """

    part_of_speech: PartOfSpeech
    lemma: str
    inflections: list[Inflection]
    _parse: Parse


    def json(self, **kwargs) -> dict:
        """Serialize the inflections container to a JSON-compatible dictionary."""
        return {
            "partOfSpeech": self.part_of_speech.name,
            "lemma": self.lemma,
            "inflections": [inflection.json() for inflection in self.inflections],
        }
