"""
Request models for the inflection API.
"""

from pydantic import BaseModel, Field, field_validator

from .language import LanguageCode
from .part_of_speech import PartOfSpeech


class InflectionRequest(BaseModel):
    """
    Request model for inflection operations.

    Attributes:
        lemma: The base form of the word to inflect.
        language: The language code for inflection (case-insensitive).
        part_of_speech: The part of speech of the word (aliased as 'pos' in JSON).
    """

    lemma: str
    language: LanguageCode
    part_of_speech: PartOfSpeech = Field(..., alias="pos")

    @field_validator("language", mode="before")
    @classmethod
    def validate_language(cls, v):
        """Convert string to LanguageCode enum, case-insensitively."""
        if isinstance(v, str):
            result = LanguageCode(v.lower())
            if result is None:
                raise ValueError(f"Unsupported language code: {v}")
            return result
        return v
