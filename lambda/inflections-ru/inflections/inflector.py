"""
Inflector module for Russian language morphological inflection.

This module provides functionality to inflect Russian words based on
grammatical features using pymorphy3.
"""

import logging

import feature_retriever
import pymorphy3
from domain.feature import Feature
from domain.inflection import Inflection, Inflections
from domain.part_of_speech import PartOfSpeech
from pymorphy3.analyzer import Parse

# Default minimum confidence score required for a parse to be considered valid
DEFAULT_CONFIDENCE_THRESHOLD = 0.5

# Mapping from pymorphy3 POS tags to our standardized PartOfSpeech enum
_PYMORPHY_POS_MAP = {
    "NOUN": PartOfSpeech.NOUN,
    "ADJF": PartOfSpeech.ADJ,  # Full adjective
    "ADJS": PartOfSpeech.ADJ,  # Short adjective
    "VERB": PartOfSpeech.VERB,
    "INFN": PartOfSpeech.VERB,  # Infinitive
    "GRND": PartOfSpeech.VERB,  # Gerund
    "PRTF": PartOfSpeech.VERB,  # Full participle
    "PRTS": PartOfSpeech.VERB,  # Short participle
}

logger = logging.getLogger(__name__)


class InflectionError(Exception):
    """Base exception for inflection-related errors."""

    def __init__(
        self,
        word: str,
        expected_pos: PartOfSpeech,
        threshold: float,
        parse: pymorphy3.analyzer.Parse,
    ):
        self.word = word
        self.expected_pos = expected_pos
        self.parse = parse
        self.threshold = threshold
        super().__init__(
            f"Best parse for '{word}' has score {parse.score:.2f}, "
            f"below threshold {threshold:.2f} (POS: {parse.tag.POS})"
        )


class LowConfidenceError(InflectionError):
    """Raised when the best parse has a confidence score below the threshold."""

    def __init__(
        self,
        word: str,
        expected_pos: PartOfSpeech,
        threshold: float,
        parse: pymorphy3.analyzer.Parse,
    ):
        super().__init__(word, expected_pos, threshold, parse)


class POSMismatchError(InflectionError):
    """Raised when the parsed POS doesn't match the expected POS."""

    def __init__(
        self, word: str, expected_pos: PartOfSpeech, parse: pymorphy3.analyzer.Parse
    ):
        super().__init__(word, expected_pos, 0.0, parse)


class Inflector:
    """
    Russian word inflector using pymorphy3.

    This class provides functionality to inflect Russian words based on
    grammatical features, with configurable confidence thresholds for
    parse validation.

    Attributes:
        confidence_threshold: Minimum confidence score required for a parse
                              to be considered valid.
    """

    def __init__(self, confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD):
        """
        Initialize the Inflector.

        Args:
            confidence_threshold: Minimum confidence score for parse validation.
                                  Defaults to DEFAULT_CONFIDENCE_THRESHOLD (0.2).
        """
        self.confidence_threshold = confidence_threshold
        self._morph = pymorphy3.MorphAnalyzer()

    def inflect(
        self,
        word: str,
        features: list[set[str]],
        expected_pos: PartOfSpeech,
    ) -> Inflections:
        """
        Inflect a word according to the provided grammatical features.

        Args:
            word: The word to inflect (typically a lemma/base form).
            features: List of feature sets, where each set represents a combination
                      of grammatical features (e.g., {'sing', 'nomn'} for singular nominative).
            expected_pos: The expected part of speech for validation.

        Returns:
            A list of Inflection objects, one for each feature set.

        Raises:
            LowConfidenceError: If the best parse has a score below the threshold.
            POSMismatchError: If the parsed POS doesn't match the expected POS.
        """
        parse = self._get_validated_parse(word, expected_pos)

        inflections = [
            self._create_inflection(parse, feature_set) for feature_set in features
        ]
        result = Inflections(
            part_of_speech=expected_pos,
            lemma=parse.normal_form,
            lemma_features=self._derive_lemma_features(parse, expected_pos),
            inflections=inflections,
        )
        result._parse = parse
        return result

    @staticmethod
    def _derive_lemma_features(
        parse: Parse, part_of_speech: PartOfSpeech
    ) -> set[Feature]:
        """
        Extract the inherent, non-inflectional features of the lexeme.

        Noun gender classifies the entire paradigm instead of varying across
        it, so it is reported once on the container rather than repeated on
        all twelve inflections. Adjectives are excluded deliberately: their
        gender is an inflectional dimension and is carried per inflected form.

        Args:
            parse: The validated pymorphy3 Parse object for the lemma.
            part_of_speech: The part of speech being inflected.

        Returns:
            Set of standardized Feature enum members, empty when the part of
            speech has no inherent features or pymorphy3 reports no gender
            (as for plurale tantum nouns such as "ножницы").
        """
        if part_of_speech is not PartOfSpeech.NOUN:
            return set()

        gender = parse.tag.gender
        if gender is None:
            return set()

        # pymorphy3 hands back a grammeme wrapper whose __eq__ raises when
        # compared against a grammeme from another attribute, so coerce to str
        # before it reaches the generic feature lookup.
        return feature_retriever.map_to_standardized_features({str(gender)})

    def _get_validated_parse(
        self,
        word: str,
        expected_pos: PartOfSpeech,
    ) -> Parse:
        """
        Parse a word and validate that it meets confidence and POS requirements.

        Selects the parse with the highest confidence score and validates that:
        1. The score is above the confidence threshold
        2. The part of speech matches the expected POS

        Args:
            word: The word to parse.
            expected_pos: The expected part of speech.

        Returns:
            The validated Parse object with the highest confidence.

        Raises:
            LowConfidenceError: If the best parse has a score below the threshold.
            POSMismatchError: If the parsed POS doesn't match the expected POS.
        """
        parses = self._morph.parse(word)

        # Select the parse with the highest confidence score
        best_parse = max(parses, key=lambda p: p.score)

        # Validate confidence score
        if best_parse.score < self.confidence_threshold:
            raise LowConfidenceError(
                word, expected_pos, self.confidence_threshold, best_parse
            )

        # Validate part of speech
        actual_pos = best_parse.tag.POS
        mapped_pos = _PYMORPHY_POS_MAP.get(actual_pos)

        if mapped_pos != expected_pos:
            raise POSMismatchError(word, expected_pos, best_parse)

        return best_parse

    @staticmethod
    def _create_inflection(parsed: Parse, features: set[str]) -> Inflection:
        """
        Create an Inflection object from a parsed word and feature set.

        Args:
            parsed: The pymorphy3 Parse object for the word.
            features: Set of grammatical features to apply (pymorphy3 format).

        Returns:
            An Inflection object containing the lemma, inflected form, and
            standardized features.
        """
        inflected = parsed.inflect(features)
        standardized_features = feature_retriever.map_to_standardized_features(features)

        return Inflection(
            lemma=parsed.normal_form,
            inflected=inflected.word if inflected else parsed.word,
            features=standardized_features,
        )
