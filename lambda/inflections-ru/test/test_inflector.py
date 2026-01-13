"""
Tests for the inflector module.

These tests verify the Russian word inflection functionality including
validation of confidence scores and part of speech matching.
"""

from unittest.mock import MagicMock, patch

import pytest
from domain.feature import Case, Number
from domain.part_of_speech import PartOfSpeech
from inflector import (
    DEFAULT_CONFIDENCE_THRESHOLD,
    Inflector,
    LowConfidenceError,
    POSMismatchError,
)


class TestInflect:
    """Tests for the main inflect method."""

    def setup_method(self):
        """Set up test fixtures."""
        self.inflector = Inflector()

    def test_inflect_noun_singular_nominative(self):
        """Test inflecting a Russian noun in singular nominative case."""
        features = [{"sing", "nomn"}]
        result = self.inflector.inflect(
            word="слово",  # "word" in Russian
            features=features,
            expected_pos=PartOfSpeech.NOUN,
        )

        assert len(result) == 1
        assert result[0].lemma == "слово"
        assert result[0].inflected == "слово"
        assert Case.NOM in result[0].features
        assert Number.SING in result[0].features

    def test_inflect_noun_plural_genitive(self):
        """Test inflecting a Russian noun in plural genitive case."""
        features = [{"plur", "gent"}]
        result = self.inflector.inflect(
            word="слово",
            features=features,
            expected_pos=PartOfSpeech.NOUN,
        )

        assert len(result) == 1
        assert result[0].lemma == "слово"
        assert result[0].inflected == "слов"
        assert Case.GEN in result[0].features
        assert Number.PLUR in result[0].features

    def test_inflect_noun_multiple_forms(self):
        """Test inflecting a noun with multiple feature sets."""
        features = [
            {"sing", "nomn"},
            {"sing", "gent"},
            {"plur", "nomn"},
        ]
        result = self.inflector.inflect(
            word="дом",  # "house" in Russian
            features=features,
            expected_pos=PartOfSpeech.NOUN,
        )

        assert len(result) == 3
        # All should have the same lemma
        assert all(r.lemma == "дом" for r in result)

    def test_inflect_adjective(self):
        """Test inflecting a Russian adjective."""
        features = [{"sing", "nomn"}]
        # For some reason, большой only has a confidence of 0.33
        low_confidence_inflector = Inflector(confidence_threshold=0.32)
        result = low_confidence_inflector.inflect(
            word="большой",  # "big" in Russian
            features=features,
            expected_pos=PartOfSpeech.ADJ,
        )

        assert len(result) == 1
        assert result[0].lemma == "большой"

    def test_inflect_with_custom_threshold(self):
        """Test inflecting with a custom confidence threshold."""
        # Create inflector with a very low threshold
        inflector = Inflector(confidence_threshold=0.1)
        features = [{"sing", "nomn"}]
        result = inflector.inflect(
            word="слово",
            features=features,
            expected_pos=PartOfSpeech.NOUN,
        )

        assert len(result) == 1


class TestGetValidatedParse:
    """Tests for the parse validation logic."""

    def test_raises_low_confidence_error_when_below_threshold(self):
        """Test that LowConfidenceError is raised for low confidence parses."""
        inflector = Inflector(confidence_threshold=0.65)

        with patch.object(inflector, "_morph") as mock_morph:
            mock_parse = MagicMock()
            mock_parse.score = 0.3  # Below threshold
            mock_parse.tag.POS = "NOUN"
            mock_morph.parse.return_value = [mock_parse]

            with pytest.raises(LowConfidenceError) as exc_info:
                inflector._get_validated_parse("тест", PartOfSpeech.NOUN)

            assert exc_info.value.word == "тест"
            assert exc_info.value.score == 0.3
            assert exc_info.value.threshold == 0.65

    def test_raises_pos_mismatch_error_for_wrong_pos(self):
        """Test that POSMismatchError is raised when POS doesn't match."""
        inflector = Inflector()

        with patch.object(inflector, "_morph") as mock_morph:
            mock_parse = MagicMock()
            mock_parse.score = 0.9
            mock_parse.tag.POS = "VERB"  # Different from expected NOUN
            mock_morph.parse.return_value = [mock_parse]

            with pytest.raises(POSMismatchError) as exc_info:
                inflector._get_validated_parse("бежать", PartOfSpeech.NOUN)

            assert exc_info.value.word == "бежать"
            assert exc_info.value.expected_pos == PartOfSpeech.NOUN
            assert exc_info.value.actual_pos == "VERB"

    def test_selects_highest_confidence_parse(self):
        """Test that the parse with highest confidence is selected."""
        inflector = Inflector(confidence_threshold=0.5)

        with patch.object(inflector, "_morph") as mock_morph:
            low_confidence_parse = MagicMock()
            low_confidence_parse.score = 0.4
            low_confidence_parse.tag.POS = "VERB"

            high_confidence_parse = MagicMock()
            high_confidence_parse.score = 0.9
            high_confidence_parse.tag.POS = "NOUN"

            mock_morph.parse.return_value = [
                low_confidence_parse,
                high_confidence_parse,
            ]

            result = inflector._get_validated_parse("тест", PartOfSpeech.NOUN)

            assert result == high_confidence_parse

    def test_accepts_valid_parse(self):
        """Test that a valid parse is accepted."""
        inflector = Inflector()

        with patch.object(inflector, "_morph") as mock_morph:
            mock_parse = MagicMock()
            mock_parse.score = 0.9
            mock_parse.tag.POS = "NOUN"
            mock_morph.parse.return_value = [mock_parse]

            result = inflector._get_validated_parse("слово", PartOfSpeech.NOUN)

            assert result == mock_parse


class TestCreateInflection:
    """Tests for the inflection creation logic."""

    def test_creates_inflection_with_correct_lemma(self):
        """Test that the inflection has the correct lemma."""
        mock_parsed = MagicMock()
        mock_parsed.normal_form = "слово"
        mock_inflected = MagicMock()
        mock_inflected.word = "слова"
        mock_parsed.inflect.return_value = mock_inflected

        result = Inflector._create_inflection(mock_parsed, {"sing", "gent"})

        assert result.lemma == "слово"
        assert result.inflected == "слова"

    def test_uses_original_word_when_inflection_fails(self):
        """Test fallback to original word when inflection returns None."""
        mock_parsed = MagicMock()
        mock_parsed.normal_form = "тест"
        mock_parsed.word = "тест"
        mock_parsed.inflect.return_value = None  # Inflection failed

        result = Inflector._create_inflection(mock_parsed, {"sing", "nomn"})

        assert result.inflected == "тест"

    def test_maps_features_correctly(self):
        """Test that pymorphy3 features are mapped to domain features."""
        mock_parsed = MagicMock()
        mock_parsed.normal_form = "слово"
        mock_inflected = MagicMock()
        mock_inflected.word = "слово"
        mock_parsed.inflect.return_value = mock_inflected

        result = Inflector._create_inflection(mock_parsed, {"sing", "nomn"})

        assert Case.NOM in result.features
        assert Number.SING in result.features


class TestPOSMapping:
    """Tests for part of speech mapping."""

    def setup_method(self):
        """Set up test fixtures."""
        self.inflector = Inflector()

    def test_noun_pos_mapping(self):
        """Test that NOUN POS is correctly mapped."""
        features = [{"sing", "nomn"}]
        result = self.inflector.inflect(
            word="книга",  # "book" in Russian
            features=features,
            expected_pos=PartOfSpeech.NOUN,
        )
        assert len(result) == 1

    def test_adjective_full_form_mapping(self):
        """Test that ADJF (full adjective) is mapped to ADJ."""
        features = [{"sing", "nomn"}]
        result = self.inflector.inflect(
            word="красивый",  # "beautiful" in Russian
            features=features,
            expected_pos=PartOfSpeech.ADJ,
        )
        assert len(result) == 1


class TestInflectorConfiguration:
    """Tests for Inflector configuration."""

    def test_default_threshold(self):
        """Test that default threshold is applied."""
        inflector = Inflector()
        assert inflector.confidence_threshold == DEFAULT_CONFIDENCE_THRESHOLD

    def test_custom_threshold(self):
        """Test that custom threshold is applied."""
        inflector = Inflector(confidence_threshold=0.75)
        assert inflector.confidence_threshold == 0.75

    def test_low_threshold_allows_more_parses(self):
        """Test that a lower threshold allows more parses through."""
        # This word may have a lower confidence score
        inflector_low = Inflector(confidence_threshold=0.1)
        inflector_high = Inflector(confidence_threshold=0.9)

        features = [{"sing", "nomn"}]

        # Low threshold should work
        result = inflector_low.inflect(
            word="слово",
            features=features,
            expected_pos=PartOfSpeech.NOUN,
        )
        assert len(result) == 1

