from pydantic import BaseModel

from inflections.domain.feature import Feature
from inflections.domain.part_of_speech import PartOfSpeech


class Inflection(BaseModel):
    lemma: str
    inflected: str
    features: set[Feature]

    def json(self, **kwargs) -> dict:
        return {
            "lemma": self.lemma,
            "inflected": self.inflected,
            "features": [feature.json() for feature in self.features],
        }


class Inflections(BaseModel):
    part_of_speech: PartOfSpeech
    lemma: str
    inflections: list[Inflection]

    def json(self, **kwargs) -> dict:
        return {
            "partOfSpeech": self.part_of_speech.name,
            "lemma": self.lemma,
            "inflections": [inflection.json() for inflection in self.inflections],
        }
