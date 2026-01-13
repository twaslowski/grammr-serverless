"""
Feature retriever module for deriving grammatical features.

This module provides functionality to:
1. Generate all possible feature combinations for a given part of speech
2. Map pymorphy3 features to standardized domain features
"""

from itertools import product
from typing import Iterable, Optional

from domain.feature import Case, Feature, Gender, Number, Person, Tense
from domain.part_of_speech import PartOfSpeech


def derive_features(part_of_speech: PartOfSpeech) -> list[set[str]]:
    """
    Generate all possible feature combinations for a given part of speech.

    For nouns and adjectives, generates all combinations of case and number.
    For verbs and auxiliaries, generates all combinations of person and number.

    Args:
        part_of_speech: Universal POS tag. Should be one of NOUN, VERB, AUX, ADJ.
                        See https://universaldependencies.org/u/pos/index.html

    Returns:
        A list of feature sets, where each set contains pymorphy3-compatible
        feature strings (e.g., {'sing', 'nomn'} for singular nominative).

    Raises:
        ValueError: If an unsupported part of speech is provided.
    """
    if part_of_speech in (PartOfSpeech.NOUN, PartOfSpeech.ADJ):
        return [{number.value, case.value} for number, case in product(Number, Case)]

    if part_of_speech in (PartOfSpeech.VERB, PartOfSpeech.AUX):
        return [
            {person.value, number.value} for person, number in product(Person, Number)
        ]

    raise ValueError(f"Unsupported part of speech: {part_of_speech}")


def map_to_standardized_features(features: set[str]) -> set[Feature]:
    """
    Map pymorphy3 feature strings to standardized domain Feature objects.

    Converts pymorphy3-specific feature codes (e.g., '1per', 'nomn', 'sing')
    to their corresponding Feature enum members (e.g., Person.FIRST, Case.NOM,
    Number.SING).

    Args:
        features: Set of pymorphy3 feature strings.

    Returns:
        Set of standardized Feature enum members. Unknown features are silently
        ignored.
    """
    return {
        feature
        for feature in (_get_feature(f) for f in features)
        if feature is not None
    }


def _get_feature(value: str) -> Optional[Feature]:
    """
    Look up a Feature enum member by its pymorphy3 value.

    Searches through all feature enums (Person, Number, Case, Gender, Tense)
    to find a member whose value matches the provided string.

    Args:
        value: A pymorphy3 feature string (e.g., '1per', 'nomn').

    Returns:
        The matching Feature enum member, or None if not found.
    """
    feature_enums = (Person, Number, Case, Gender, Tense)

    for enum in feature_enums:
        member = _get_enum_member(enum, value)
        if member is not None:
            return member

    return None


def _get_enum_member(enum: Iterable[Feature], value: str) -> Optional[Feature]:
    """
    Find an enum member by its value.

    Args:
        enum: An iterable of Feature enum members.
        value: The value to search for.

    Returns:
        The matching enum member, or None if not found.
    """
    try:
        return next(member for member in enum if member.value == value)
    except StopIteration:
        return None
