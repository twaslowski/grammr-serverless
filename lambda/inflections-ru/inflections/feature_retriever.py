from itertools import product
from typing import Iterable

from domain import Case, Feature, Gender, Number, Person, Tense
from domain import PartOfSpeech


def derive_features(part_of_speech: PartOfSpeech) -> list[set[str]]:
    """
    Generates all possible features for a given part of speech, e.g. all possible
    combinations of case and number for a noun.
    :param part_of_speech: universal part of speech tag, see https://universaldependencies.org/u/pos/index.html
    Should be one of "NOUN", "VERB", "AUX", "ADJ" for words that can be inflected.
    :return:
    """
    if part_of_speech == PartOfSpeech.NOUN or part_of_speech == PartOfSpeech.ADJ:
        return [{number.value, case.value} for number, case in product(Number, Case)]
    if part_of_speech == PartOfSpeech.VERB or part_of_speech == PartOfSpeech.AUX:
        return [
            {person.value, number.value} for person, number in product(Person, Number)
        ]
    else:
        raise Exception(f"Received unexpected pos: {part_of_speech}")


def map_to_standardized_features(features: set) -> set[Feature]:
    """
    Maps the pymorphy3 features to the standardized features used in the domain,
    e.g. "1per" -> FIRST, nomn -> NOM, sing -> SING etc.
    :param features: set of pymorphy3 features
    :return:
    """
    return {feature for feature in map(_get_feature, features) if feature is not None}


def _get_feature(value: str) -> Feature | None:
    for enum in (Person, Number, Case, Gender, Tense):
        member = _get_enum_member(enum, value)
        if member is not None:
            return member
    return None


def _get_enum_member(enum: Iterable, value: str) -> Feature | None:
    try:
        return next(member for member in enum if member.value == value)
    except StopIteration:
        return None
