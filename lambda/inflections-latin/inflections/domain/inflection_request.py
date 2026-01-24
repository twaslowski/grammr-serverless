"""
Request models for the inflection API.
"""

from pydantic import BaseModel, Field

from .part_of_speech import PartOfSpeech


class InflectionRequest(BaseModel):
    """
    Request model for inflection operations.

    Attributes:
        lemma: The base form of the word to inflect.
        part_of_speech: The part of speech of the word (aliased as 'pos' in JSON).
    """

    lemma: str
    part_of_speech: PartOfSpeech = Field(..., alias="pos")
