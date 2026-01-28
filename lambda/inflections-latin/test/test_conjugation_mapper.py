"""
Tests for the conjugation_mapper module.

These tests verify the mapping from verbecc Conjugation objects
to domain Inflection objects, including edge cases and error handling.
"""

import pytest
from verbecc import Conjugation
from verbecc.src.defs.types.person import Person as VerbeccPerson
from verbecc.src.defs.types.number import Number as VerbeccNumber
from verbecc.src.defs.types.gender import Gender as VerbeccGender

from conjugation_mapper import (
    map_conjugation,
    ConjugationMappingError,
    _map_person,
    _map_number,
    _map_gender,
)
from domain.feature import Person, Number, Gender
from domain.inflection import Inflection


class TestMapPerson:
    """Tests for the _map_person helper function."""

    def test_map_first_person(self):
        """Test mapping first person."""
        result = _map_person(VerbeccPerson.First)
        assert result == Person.FIRST

    def test_map_second_person(self):
        """Test mapping second person."""
        result = _map_person(VerbeccPerson.Second)
        assert result == Person.SECOND

    def test_map_third_person(self):
        """Test mapping third person."""
        result = _map_person(VerbeccPerson.Third)
        assert result == Person.THIRD

    def test_map_none_person(self):
        """Test that None input returns None."""
        result = _map_person(None)
        assert result is None


class TestMapNumber:
    """Tests for the _map_number helper function."""

    def test_map_singular(self):
        """Test mapping singular number."""
        result = _map_number(VerbeccNumber.Singular)
        assert result == Number.SING

    def test_map_plural(self):
        """Test mapping plural number."""
        result = _map_number(VerbeccNumber.Plural)
        assert result == Number.PLUR

    def test_map_none_number(self):
        """Test that None input returns None."""
        result = _map_number(None)
        assert result is None


class TestMapGender:
    """Tests for the _map_gender helper function."""

    def test_map_masculine(self):
        """Test mapping masculine gender."""
        result = _map_gender(VerbeccGender.m)
        assert result == Gender.MASC

    def test_map_feminine(self):
        """Test mapping feminine gender."""
        result = _map_gender(VerbeccGender.f)
        assert result == Gender.FEM

    def test_map_none_gender(self):
        """Test that None input returns None."""
        result = _map_gender(None)
        assert result is None


class TestMapConjugation:
    """Tests for the map_conjugation function."""

    def test_map_basic_conjugation(self):
        """Test mapping a basic conjugation with person and number."""
        conjugation = Conjugation(
            person=VerbeccPerson.First,
            number=VerbeccNumber.Singular,
            conjugations=["io sono"],
        )

        result = map_conjugation(conjugation, "essere")

        assert isinstance(result, Inflection)
        assert result.lemma == "essere"
        assert result.inflected == "io sono"
        assert result.features == {Person.FIRST, Number.SING}

    def test_map_conjugation_with_gender(self):
        """Test mapping a conjugation that includes gender (e.g., participle)."""
        conjugation = Conjugation(
            number=VerbeccNumber.Singular,
            gender=VerbeccGender.m,
            conjugations=["stato"],
        )

        result = map_conjugation(conjugation, "essere")

        assert result.lemma == "essere"
        assert result.inflected == "stato"
        assert result.features == {Number.SING, Gender.MASC}

    def test_map_conjugation_with_all_features(self):
        """Test mapping a conjugation with person, number, and gender."""
        conjugation = Conjugation(
            person=VerbeccPerson.Third,
            number=VerbeccNumber.Singular,
            gender=VerbeccGender.f,
            conjugations=["lei è"],
        )

        result = map_conjugation(conjugation, "essere")

        assert result.features == {Person.THIRD, Number.SING, Gender.FEM}

    def test_map_conjugation_with_no_features(self):
        """Test mapping a conjugation with no grammatical features (e.g., infinitive)."""
        conjugation = Conjugation(
            conjugations=["essere"],
        )

        result = map_conjugation(conjugation, "essere")

        assert result.lemma == "essere"
        assert result.inflected == "essere"
        assert result.features == set()

    def test_map_conjugation_uses_first_form_when_multiple(self):
        """Test that the primary (first) conjugated form is used when multiple exist."""
        conjugation = Conjugation(
            person=VerbeccPerson.Second,
            number=VerbeccNumber.Singular,
            conjugations=["tu sei", "alternate form"],
        )

        result = map_conjugation(conjugation, "essere")

        assert result.inflected == "tu sei"

    def test_map_conjugation_strips_lemma_whitespace(self):
        """Test that leading/trailing whitespace in lemma is stripped."""
        conjugation = Conjugation(
            person=VerbeccPerson.First,
            number=VerbeccNumber.Singular,
            conjugations=["io sono"],
        )

        result = map_conjugation(conjugation, "  essere  ")

        assert result.lemma == "essere"

    def test_map_conjugation_raises_on_empty_conjugations(self):
        """Test that an error is raised when conjugation has no inflected forms."""
        conjugation = Conjugation(
            person=VerbeccPerson.First,
            number=VerbeccNumber.Singular,
            conjugations=[],
        )

        with pytest.raises(ConjugationMappingError) as exc_info:
            map_conjugation(conjugation, "essere")

        assert "no inflected forms" in str(exc_info.value)
        assert exc_info.value.conjugation is conjugation

    def test_map_conjugation_raises_on_empty_lemma(self):
        """Test that an error is raised when lemma is empty."""
        conjugation = Conjugation(
            person=VerbeccPerson.First,
            number=VerbeccNumber.Singular,
            conjugations=["io sono"],
        )

        with pytest.raises(ConjugationMappingError) as exc_info:
            map_conjugation(conjugation, "")

        assert "Lemma cannot be empty" in str(exc_info.value)

    def test_map_conjugation_raises_on_whitespace_only_lemma(self):
        """Test that an error is raised when lemma contains only whitespace."""
        conjugation = Conjugation(
            person=VerbeccPerson.First,
            number=VerbeccNumber.Singular,
            conjugations=["io sono"],
        )

        with pytest.raises(ConjugationMappingError) as exc_info:
            map_conjugation(conjugation, "   ")

        assert "Lemma cannot be empty" in str(exc_info.value)

    def test_map_conjugation_raises_type_error_on_invalid_conjugation_type(self):
        """Test that TypeError is raised when conjugation is not a Conjugation instance."""
        with pytest.raises(TypeError) as exc_info:
            map_conjugation("not a conjugation", "essere")

        assert "Expected Conjugation instance" in str(exc_info.value)
        assert "str" in str(exc_info.value)

    def test_map_conjugation_raises_type_error_on_none_conjugation(self):
        """Test that TypeError is raised when conjugation is None."""
        with pytest.raises(TypeError) as exc_info:
            map_conjugation(None, "essere")

        assert "Expected Conjugation instance" in str(exc_info.value)
        assert "NoneType" in str(exc_info.value)

    def test_map_conjugation_raises_type_error_on_invalid_lemma_type(self):
        """Test that TypeError is raised when lemma is not a string."""
        conjugation = Conjugation(
            person=VerbeccPerson.First,
            number=VerbeccNumber.Singular,
            conjugations=["io sono"],
        )

        with pytest.raises(TypeError) as exc_info:
            map_conjugation(conjugation, 123)

        assert "Expected str for lemma" in str(exc_info.value)
        assert "int" in str(exc_info.value)

    def test_map_conjugation_raises_type_error_on_none_lemma(self):
        """Test that TypeError is raised when lemma is None."""
        conjugation = Conjugation(
            person=VerbeccPerson.First,
            number=VerbeccNumber.Singular,
            conjugations=["io sono"],
        )

        with pytest.raises(TypeError) as exc_info:
            map_conjugation(conjugation, None)

        assert "Expected str for lemma" in str(exc_info.value)


class TestMapConjugationIntegration:
    """Integration tests using real-world conjugation scenarios."""

    @pytest.mark.parametrize(
        "person,number,expected_person,expected_number",
        [
            (VerbeccPerson.First, VerbeccNumber.Singular, Person.FIRST, Number.SING),
            (VerbeccPerson.First, VerbeccNumber.Plural, Person.FIRST, Number.PLUR),
            (VerbeccPerson.Second, VerbeccNumber.Singular, Person.SECOND, Number.SING),
            (VerbeccPerson.Second, VerbeccNumber.Plural, Person.SECOND, Number.PLUR),
            (VerbeccPerson.Third, VerbeccNumber.Singular, Person.THIRD, Number.SING),
            (VerbeccPerson.Third, VerbeccNumber.Plural, Person.THIRD, Number.PLUR),
        ],
    )
    def test_all_person_number_combinations(
        self, person, number, expected_person, expected_number
    ):
        """Test that all person/number combinations are correctly mapped."""
        conjugation = Conjugation(
            person=person,
            number=number,
            conjugations=["test form"],
        )

        result = map_conjugation(conjugation, "test_lemma")

        assert expected_person in result.features
        assert expected_number in result.features
        assert len(result.features) == 2

    @pytest.mark.parametrize(
        "gender,expected_gender",
        [
            (VerbeccGender.m, Gender.MASC),
            (VerbeccGender.f, Gender.FEM),
        ],
    )
    def test_all_gender_mappings(self, gender, expected_gender):
        """Test that all gender values are correctly mapped."""
        conjugation = Conjugation(
            gender=gender,
            number=VerbeccNumber.Singular,
            conjugations=["test form"],
        )

        result = map_conjugation(conjugation, "test_lemma")

        assert expected_gender in result.features
