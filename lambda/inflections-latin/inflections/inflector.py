"""
Inflector module for Romance language verb conjugation.

This module provides functionality to conjugate verbs in Romance languages
(Italian, French, Spanish, Portuguese, Romanian) using the verbecc library.
"""

import logging
import os
from typing import Optional, Union

import feature_retriever
from domain.inflection import Inflection
from domain.language import LanguageCode
from verbecc import CompleteConjugator, localization


# Default mood and tense for conjugation
DEFAULT_MOOD = "indicative"
DEFAULT_TENSE = "present"

logger = logging.getLogger(__name__)


class InflectionError(Exception):
    """Base exception for inflection-related errors."""

    pass


class UnsupportedLanguageError(InflectionError):
    """Raised when an unsupported language code is provided."""

    def __init__(self, language: str):
        self.language = language
        supported = ', '.join(sorted(lc.value for lc in LanguageCode))
        super().__init__(
            f"Language '{language}' is not supported. "
            f"Supported languages: {supported}"
        )


class ConjugationError(InflectionError):
    """Raised when verb conjugation fails."""

    def __init__(self, lemma: str, language: str, reason: str):
        self.lemma = lemma
        self.language = language
        self.reason = reason
        super().__init__(f"Failed to conjugate '{lemma}' in language '{language}': {reason}")


class Inflector:
    """
    Romance language verb conjugator using verbecc.

    This class provides functionality to conjugate verbs in Romance languages
    (Italian, French, Spanish, Portuguese, Romanian) based on mood and tense.

    Attributes:
        language: The ISO 639-1 language code for conjugation.
        mood: The grammatical mood for conjugation (default: indicative).
        tense: The tense for conjugation (default: present).
    """

    def __init__(
        self,
        language: Optional[Union[str, LanguageCode]] = None,
        mood: str = DEFAULT_MOOD,
        tense: str = DEFAULT_TENSE,
    ):
        """
        Initialize the Inflector.

        Args:
            language: ISO 639-1 language code (it, fr, es, pt, ro) or LanguageCode enum.
                      If not provided, reads from LANGUAGE_CODE environment variable.
            mood: The grammatical mood for conjugation. Defaults to "indicative".
            tense: The tense for conjugation. Defaults to "present".

        Raises:
            UnsupportedLanguageError: If the language code is not supported.
            ValueError: If no language is provided and LANGUAGE_CODE env var is not set.
        """
        # Get language from parameter or environment variable
        lang_input = language or os.environ.get("LANGUAGE_CODE")

        if lang_input is None:
            raise ValueError(
                "Language must be provided either as a parameter or via "
                "the LANGUAGE_CODE environment variable."
            )

        # Validate and convert to LanguageCode enum
        if isinstance(lang_input, LanguageCode):
            self.language_code = lang_input
        else:
            # Try case-insensitive lookup
            self.language_code = LanguageCode(lang_input.lower())
            if self.language_code is None:
                raise UnsupportedLanguageError(lang_input)

        self.language = self.language_code.value
        self.mood = mood
        self.tense = tense

        logger.info(f"Initializing conjugator for language: {self.language}")
        self._conjugator = CompleteConjugator(lang=self.language)

    def inflect(self, lemma: str) -> list[Inflection]:
        """
        Conjugate a verb according to the configured mood and tense.

        This method generates all person/number combinations for the given
        verb lemma in the configured mood and tense.

        Args:
            lemma: The infinitive form of the verb to conjugate.

        Returns:
            A list of Inflection objects, one for each person/number combination.

        Raises:
            ConjugationError: If the verb cannot be conjugated.
        """
        if not lemma or not lemma.strip():
            raise ConjugationError(lemma, self.language, "Lemma cannot be empty")

        lemma = lemma.strip()

        # Retrieve the expected grammatical features for this conjugation
        features = feature_retriever.retrieve_features()

        # Perform the conjugation
        conjugated_forms = self._conjugate(lemma)

        logger.info(f"Conjugated '{lemma}' ({self.language}): {conjugated_forms}")

        # todo: le/lui è (3rd person sing) breaks this as it is generated twice, with gender=m|f
        # Validate we got the expected number of forms
        if len(conjugated_forms) != len(features):
            raise ConjugationError(
                lemma,
                self.language,
                f"Expected {len(features)} forms, got {len(conjugated_forms)}",
            )

        # Build the list of Inflection objects
        return [
            Inflection(lemma=lemma, inflected=inflected, features=feature)
            for feature, inflected in zip(features, conjugated_forms)
        ]

    def _conjugate(self, lemma: str) -> list[str]:
        """
        Perform the actual verb conjugation using verbecc.

        Args:
            lemma: The infinitive form of the verb to conjugate.

        Returns:
            A list of conjugated forms for each person/number combination.

        Raises:
            ConjugationError: If the conjugation fails.
        """
        try:
            conjugation_result = self._conjugator.conjugate(lemma)

            # Navigate to the correct mood and tense in the conjugation result
            localized_mood = localization.xmood(self.language, self.mood)
            localized_tense = localization.xtense(self.language, self.tense)

            moods = conjugation_result.get_moods()

            if localized_mood not in moods:
                raise ConjugationError(
                    lemma,
                    self.language,
                    f"Mood '{self.mood}' ({localized_mood}) not available",
                )

            tenses = moods[localized_mood]

            if localized_tense not in tenses:
                raise ConjugationError(
                    lemma,
                    self.language,
                    f"Tense '{self.tense}' ({localized_tense}) not available "
                    f"for mood '{self.mood}'",
                )

            return tenses[localized_tense]

        except ConjugationError:
            # Re-raise our own errors
            raise
        except Exception as e:
            # Wrap any other errors from verbecc
            raise ConjugationError(lemma, self.language, str(e)) from e
