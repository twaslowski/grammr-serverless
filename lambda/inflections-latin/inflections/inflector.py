"""
Inflector module for Romance language verb conjugation.

This module provides functionality to conjugate verbs in Romance languages
(Italian, French, Spanish, Portuguese, Romanian) using the verbecc library.
"""

import logging
from typing import Optional

from conjugation_mapper import map_conjugation
from domain.inflection import Inflection
from domain.feature import Person, Number
from domain.language import LanguageCode
from verbecc import CompleteConjugator, TenseConjugation, localization, LangCodeISO639_1


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
        language: str,
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
        if language is None:
            raise ValueError(
                "Language must be provided either as a parameter or via "
                "the LANGUAGE_CODE environment variable."
            )

        # Raises ValueError if it doesn't match the enum
        self.language = LangCodeISO639_1(language)
        self.mood = mood
        self.tense = tense

        logger.info(f"Initializing conjugator for language: {self.language}")
        self._conjugator = CompleteConjugator(self.language)

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

        # Perform the conjugation
        tense_conjugation = self._conjugate(lemma)

        # Map verbecc Conjugation objects to domain Inflection objects
        inflections = [
            map_conjugation(conjugation, lemma)
            for conjugation in tense_conjugation
        ]

        # Merge inflections that differ only in gender (same person/number)
        merged_inflections = self._merge_by_person_number(inflections)

        return merged_inflections

    @staticmethod
    def _merge_by_person_number(inflections: list[Inflection]) -> list[Inflection]:
        """
        Merge inflections that have the same person/number but different genders.

        In Romance languages, third-person conjugations may have separate forms
        for masculine (lui è) and feminine (lei è) pronouns, but the verb form
        is the same. This method merges such inflections by combining their
        inflected forms with a "/" separator.

        Args:
            inflections: List of Inflection objects to merge.

        Returns:
            List of merged Inflection objects, grouped by person/number.
        """
        if not inflections:
            return inflections

        # Group inflections by (person, number) key
        grouped: dict[tuple[Optional[Person], Optional[Number]], list[Inflection]] = {}

        for inflection in inflections:
            # Extract person and number from features
            person = next((f for f in inflection.features if isinstance(f, Person)), None)
            number = next((f for f in inflection.features if isinstance(f, Number)), None)
            key = (person, number)

            if key not in grouped:
                grouped[key] = []
            grouped[key].append(inflection)

        # Merge each group
        merged: list[Inflection] = []
        for (person, number), group in grouped.items():
            if len(group) == 1:
                # No merging needed - just remove gender from features
                inflection = group[0]
                features = {f for f in inflection.features if isinstance(f, (Person, Number))}
                merged.append(Inflection(
                    lemma=inflection.lemma,
                    inflected=inflection.inflected,
                    features=features,
                ))
            else:
                # Multiple inflections for same person/number - merge them
                # Combine unique inflected forms with "/"
                unique_forms: list[str] = []
                for inf in group:
                    # Extract pronoun and verb parts
                    parts = inf.inflected.split(" ", 1)
                    if len(parts) == 2:
                        pronoun, verb = parts
                        # Check if we already have this verb with a different pronoun
                        existing_idx = None
                        for idx, form in enumerate(unique_forms):
                            form_parts = form.split(" ", 1)
                            if len(form_parts) == 2 and form_parts[1] == verb:
                                existing_idx = idx
                                break
                        if existing_idx is not None:
                            # Merge pronouns
                            existing_parts = unique_forms[existing_idx].split(" ", 1)
                            merged_pronoun = f"{existing_parts[0]}/{pronoun}"
                            unique_forms[existing_idx] = f"{merged_pronoun} {verb}"
                        else:
                            unique_forms.append(inf.inflected)
                    else:
                        # No pronoun structure, just add if not duplicate
                        if inf.inflected not in unique_forms:
                            unique_forms.append(inf.inflected)

                # Build merged features (only person and number)
                features: set = set()
                if person is not None:
                    features.add(person)
                if number is not None:
                    features.add(number)

                # Use first unique form (or merged form)
                merged.append(Inflection(
                    lemma=group[0].lemma,
                    inflected=unique_forms[0] if unique_forms else group[0].inflected,
                    features=features,
                ))

        return merged

    def _conjugate(self, lemma: str) -> TenseConjugation:
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
