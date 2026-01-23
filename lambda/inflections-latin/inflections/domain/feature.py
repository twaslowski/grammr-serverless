"""
Grammatical feature enums for Russian language morphology.

These enums represent grammatical features that can be applied to words
during inflection. Each enum member's value corresponds to the pymorphy3
tag for that feature.
"""

from enum import Enum


class Feature(Enum):
    """
    Base class for all grammatical features.

    Provides common functionality for JSON serialization.
    """

    def json(self) -> dict:
        """Serialize the feature to a JSON-compatible dictionary."""
        return {"type": self.__class__.__name__.upper(), "value": self.name}


class Case(Feature):
    """Russian grammatical cases."""

    NOM = "nomn"  # Nominative (именительный)
    GEN = "gent"  # Genitive (родительный)
    DAT = "datv"  # Dative (дательный)
    ACC = "accs"  # Accusative (винительный)
    ABL = "ablt"  # Ablative/Instrumental (творительный)
    LOC = "loct"  # Locative/Prepositional (предложный)


class Number(Feature):
    """Grammatical number."""

    SING = "sing"  # Singular
    PLUR = "plur"  # Plural


class Gender(Feature):
    """Grammatical gender."""

    MASC = "masc"  # Masculine
    FEM = "femn"  # Feminine
    NEUT = "neut"  # Neuter


class Person(Feature):
    """Grammatical person for verb conjugation."""

    FIRST = "1per"  # First person (I/we)
    SECOND = "2per"  # Second person (you)
    THIRD = "3per"  # Third person (he/she/it/they)


class Tense(Feature):
    """Verb tense."""

    PAST = "past"  # Past tense
    PRES = "pres"  # Present tense
    FUT = "futr"  # Future tense
