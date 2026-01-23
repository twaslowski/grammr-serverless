"""
Conjugation mapper module.

This module provides functionality to map verbecc Conjugation objects
to domain Inflection objects.
"""

from typing import Optional

from verbecc import Conjugation
from verbecc.src.defs.types.person import Person as VerbeccPerson
from verbecc.src.defs.types.number import Number as VerbeccNumber
from verbecc.src.defs.types.gender import Gender as VerbeccGender

from domain.inflection import Inflection
from domain.feature import Feature, Person, Number, Gender


class ConjugationMappingError(Exception):
    """Raised when a Conjugation cannot be mapped to an Inflection."""

    def __init__(self, message: str, conjugation: Optional[Conjugation] = None):
        self.conjugation = conjugation
        super().__init__(message)


def _map_person(verbecc_person: Optional[VerbeccPerson]) -> Optional[Person]:
    """
    Map a verbecc Person to a domain Person.

    Args:
        verbecc_person: The verbecc Person enum value.

    Returns:
        The corresponding domain Person, or None if input is None.

    Raises:
        ConjugationMappingError: If the person value is not recognized.
    """
    if verbecc_person is None:
        return None

    mapping = {
        VerbeccPerson.First: Person.FIRST,
        VerbeccPerson.Second: Person.SECOND,
        VerbeccPerson.Third: Person.THIRD,
    }

    if verbecc_person not in mapping:
        raise ConjugationMappingError(f"Unknown person value: {verbecc_person}")

    return mapping[verbecc_person]


def _map_number(verbecc_number: Optional[VerbeccNumber]) -> Optional[Number]:
    """
    Map a verbecc Number to a domain Number.

    Args:
        verbecc_number: The verbecc Number enum value.

    Returns:
        The corresponding domain Number, or None if input is None.

    Raises:
        ConjugationMappingError: If the number value is not recognized.
    """
    if verbecc_number is None:
        return None

    mapping = {
        VerbeccNumber.Singular: Number.SING,
        VerbeccNumber.Plural: Number.PLUR,
    }

    if verbecc_number not in mapping:
        raise ConjugationMappingError(f"Unknown number value: {verbecc_number}")

    return mapping[verbecc_number]


def _map_gender(verbecc_gender: Optional[VerbeccGender]) -> Optional[Gender]:
    """
    Map a verbecc Gender to a domain Gender.

    Args:
        verbecc_gender: The verbecc Gender enum value.

    Returns:
        The corresponding domain Gender, or None if input is None.

    Raises:
        ConjugationMappingError: If the gender value is not recognized.
    """
    if verbecc_gender is None:
        return None

    mapping = {
        VerbeccGender.m: Gender.MASC,
        VerbeccGender.f: Gender.FEM,
    }

    if verbecc_gender not in mapping:
        raise ConjugationMappingError(f"Unknown gender value: {verbecc_gender}")

    return mapping[verbecc_gender]


def map_conjugation(conjugation: Conjugation, lemma: str) -> Inflection:
    """
    Map a verbecc Conjugation to a domain Inflection.

    Args:
        conjugation: The verbecc Conjugation object to map.
        lemma: The base/dictionary form of the verb.

    Returns:
        An Inflection domain object containing the mapped data.

    Raises:
        ConjugationMappingError: If the conjugation is None, has no conjugated forms,
                                  or contains unrecognized feature values.
        TypeError: If conjugation is not a Conjugation instance or lemma is not a string.
    """
    # Defensive type checks
    if not isinstance(conjugation, Conjugation):
        raise TypeError(
            f"Expected Conjugation instance, got {type(conjugation).__name__}"
        )

    if not isinstance(lemma, str):
        raise TypeError(f"Expected str for lemma, got {type(lemma).__name__}")

    if not lemma or not lemma.strip():
        raise ConjugationMappingError("Lemma cannot be empty", conjugation)

    # Get conjugated forms - must have at least one
    conjugations = conjugation.get_conjugations()
    if not conjugations:
        raise ConjugationMappingError(
            "Conjugation has no inflected forms", conjugation
        )

    # Use the primary (first) conjugated form
    inflected_form = conjugations[0]

    # Build feature set from available grammatical information
    features: set[Feature] = set()

    person = _map_person(conjugation.get_person())
    if person is not None:
        features.add(person)

    number = _map_number(conjugation.get_number())
    if number is not None:
        features.add(number)

    gender = _map_gender(conjugation.get_gender())
    if gender is not None:
        features.add(gender)

    return Inflection(
        lemma=lemma.strip(),
        inflected=inflected_form,
        features=features,
    )
