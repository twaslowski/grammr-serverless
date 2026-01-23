"""
Feature retriever module for Romance language verb conjugation.

This module provides functionality to generate grammatical feature sets
for verb conjugation (person and number combinations).
"""

from itertools import product

from domain.feature import Feature, Number, Person
from domain.part_of_speech import PartOfSpeech


def retrieve_features() -> list[set[Feature]]:
    """
    Retrieve all person/number feature combinations for verb conjugation.

    Returns a list of feature sets representing all six person/number
    combinations used in Romance language verb conjugation:
    - 1st person singular, 1st person plural
    - 2nd person singular, 2nd person plural
    - 3rd person singular, 3rd person plural

    Returns:
        A list of 6 feature sets, each containing a Person and Number enum.
    """
    return [{person, number} for person, number in product(Person, Number)]


def derive_features(part_of_speech: PartOfSpeech) -> list[set[Feature]]:
    """
    Generate all possible feature combinations for a given part of speech.

    For verbs and auxiliaries, generates all combinations of person and number.

    Args:
        part_of_speech: Universal POS tag. Should be VERB or AUX.
                        See https://universaldependencies.org/u/pos/index.html

    Returns:
        A list of feature sets for verb conjugation.

    Raises:
        ValueError: If an unsupported part of speech is provided.
    """
    if part_of_speech in (PartOfSpeech.VERB, PartOfSpeech.AUX):
        return retrieve_features()

    raise ValueError(f"Unsupported part of speech: {part_of_speech}")


def is_word_inflectable(part_of_speech: str) -> bool:
    """
    Check if a word with the given part of speech can be inflected.

    Only verbs and auxiliary verbs can be conjugated in Romance languages.

    Args:
        part_of_speech: The part of speech tag string.

    Returns:
        True if the word can be conjugated, False otherwise.
    """
    return part_of_speech in ("VERB", "AUX")
