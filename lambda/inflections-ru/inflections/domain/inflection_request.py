from pydantic import BaseModel, Field

from ..domain import PartOfSpeech


class InflectionRequest(BaseModel):
    lemma: str
    part_of_speech: PartOfSpeech = Field(..., alias="pos")
