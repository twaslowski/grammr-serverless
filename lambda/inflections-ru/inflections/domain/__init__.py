"""
Domain models for Russian language inflection.

This package contains all domain entities including grammatical features,
parts of speech, and inflection models.
"""

from .feature import Case, Feature, Gender, Number, Person, Tense
from .inflection import Inflection, Inflections
from .inflection_request import InflectionRequest
from .part_of_speech import PartOfSpeech

__all__ = [
    "Case",
    "Feature",
    "Gender",
    "Number",
    "Person",
    "Tense",
    "Inflection",
    "Inflections",
    "InflectionRequest",
    "PartOfSpeech",
]
