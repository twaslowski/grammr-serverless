"""
Tests for the inflector module.

These tests verify the Romance language verb conjugation functionality
including validation of language codes, mood/tense handling, and error cases.
"""

import os
from unittest.mock import patch

import pytest
from domain.feature import Number, Person
from domain.language import LanguageCode
from inflector import (
    ConjugationError,
    Inflector,
    UnsupportedLanguageError,
    DEFAULT_MOOD,
    DEFAULT_TENSE,
)


class TestInflectorInitialization:
    """Tests for Inflector initialization."""

    def test_init_with_language_parameter(self):
        """Test initializing with an explicit language parameter."""
        inflector = Inflector(language="it")
        assert inflector.language == "it"
        assert inflector.mood == DEFAULT_MOOD
        assert inflector.tense == DEFAULT_TENSE

    def test_init_with_custom_mood_and_tense(self):
        """Test initializing with custom mood and tense."""
        inflector = Inflector(language="it", mood="subjunctive", tense="imperfect")
        assert inflector.mood == "subjunctive"
        assert inflector.tense == "imperfect"

    def test_init_raises_value_error_when_no_language(self):
        """Test that initialization fails when no language is provided."""
        with pytest.raises(TypeError):
            Inflector()

    def test_init_raises_unsupported_language_error(self):
        """Test that initialization fails for unsupported languages."""
        with pytest.raises(UnsupportedLanguageError) as exc_info:
            Inflector(language="de")
        assert exc_info.value.language == "de"
        assert "de" in str(exc_info.value)

    @pytest.mark.parametrize("language", [lc.value for lc in LanguageCode])
    def test_all_supported_languages_can_initialize(self, language):
        """Test that all supported languages can be initialized."""
        inflector = Inflector(language=language)
        assert inflector.language == language


class TestInflect:
    """Tests for the main inflect method."""

    def test_conjugate_italian_verb(self):
        """Test conjugating an Italian verb in present indicative."""
        inflector = Inflector(language="it")
        inflections = inflector.inflect("essere")

        assert len(inflections) == 6

        # Check first person singular
        assert inflections[0].lemma == "essere"
        assert inflections[0].inflected == "io sono"
        assert inflections[0].features == {Person.FIRST, Number.SING}

        # Check second person singular
        assert inflections[1].inflected == "tu sei"
        assert inflections[1].features == {Person.SECOND, Number.SING}

    def test_conjugate_french_verb(self):
        """Test conjugating a French verb in present indicative."""
        inflector = Inflector(language="fr")
        inflections = inflector.inflect("être")

        assert len(inflections) == 6
        assert inflections[0].lemma == "être"

    def test_conjugate_spanish_verb(self):
        """Test conjugating a Spanish verb in present indicative."""
        inflector = Inflector(language="es")
        inflections = inflector.inflect("ser")

        assert len(inflections) == 6
        assert inflections[0].lemma == "ser"

    def test_conjugate_portuguese_verb(self):
        """Test conjugating a Portuguese verb in present indicative."""
        inflector = Inflector(language="pt")
        inflections = inflector.inflect("ser")

        assert len(inflections) == 6
        assert inflections[0].lemma == "ser"

    def test_inflect_raises_error_for_empty_lemma(self):
        """Test that inflect raises an error for empty lemma."""
        inflector = Inflector(language="it")
        with pytest.raises(ConjugationError, match="cannot be empty"):
            inflector.inflect("")

    def test_inflect_raises_error_for_whitespace_lemma(self):
        """Test that inflect raises an error for whitespace-only lemma."""
        inflector = Inflector(language="it")
        with pytest.raises(ConjugationError, match="cannot be empty"):
            inflector.inflect("   ")

    def test_inflect_strips_whitespace_from_lemma(self):
        """Test that inflect strips leading/trailing whitespace."""
        inflector = Inflector(language="it")
        inflections = inflector.inflect("  essere  ")

        assert len(inflections) == 6
        assert inflections[0].lemma == "essere"

    def test_inflect_raises_error_for_unknown_verb(self):
        """Test that inflect raises an error for unknown verbs."""
        inflector = Inflector(language="it")
        with pytest.raises(ConjugationError):
            inflector.inflect("xyzabc123")


class TestConjugateWithDifferentMoodsAndTenses:
    """Tests for conjugation with different moods and tenses."""

    def test_conjugate_past_tense(self):
        """Test conjugating a verb in past tense."""
        # Using imperfect past since it's widely available
        inflector = Inflector(language="it", tense="imperfect")
        inflections = inflector.inflect("essere")

        assert len(inflections) == 6
        # Italian imperfect forms of "essere"
        assert inflections[0].inflected == "io ero"

    def test_conjugate_future_tense(self):
        """Test conjugating a verb in future tense."""
        inflector = Inflector(language="it", tense="future")
        inflections = inflector.inflect("essere")

        assert len(inflections) == 6
        assert inflections[0].inflected == "io sarò"

    def test_conjugate_raises_error_for_invalid_mood(self):
        """Test that conjugate raises error for invalid mood."""
        inflector = Inflector(language="it", mood="nonexistent")
        with pytest.raises(ConjugationError, match="nonexistent"):
            inflector.inflect("essere")

    def test_conjugate_raises_error_for_invalid_tense(self):
        """Test that conjugate raises error for invalid tense."""
        inflector = Inflector(language="it", tense="nonexistent")
        with pytest.raises(ConjugationError, match="nonexistent"):
            inflector.inflect("essere")


class TestExceptionClasses:
    """Tests for custom exception classes."""

    def test_unsupported_language_error_message(self):
        """Test that UnsupportedLanguageError has correct message."""
        error = UnsupportedLanguageError("xyz")
        assert error.language == "xyz"
        assert "xyz" in str(error)
        assert "not supported" in str(error)

    def test_conjugation_error_message(self):
        """Test that ConjugationError has correct message."""
        error = ConjugationError("verb", "it", "some reason")
        assert error.lemma == "verb"
        assert error.language == "it"
        assert error.reason == "some reason"
        assert "verb" in str(error)
        assert "it" in str(error)
        assert "some reason" in str(error)
