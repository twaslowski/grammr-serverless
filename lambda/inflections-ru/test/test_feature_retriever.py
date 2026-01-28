"""
Tests for the feature_retriever module.

These tests verify the feature derivation and mapping functionality
for Russian grammatical features.
"""

import feature_retriever
import pytest
from domain.feature import Case, Gender, Number, Person, Tense
from domain.part_of_speech import PartOfSpeech
from feature_retriever import (
    _get_enum_member,
    _get_feature,
    derive_features,
    map_to_standardized_features,
)


class TestDeriveFeatures:
    """Tests for the derive_features function."""

    def test_derive_features_for_noun(self):
        """Test that noun features include all case/number combinations."""
        features = derive_features(PartOfSpeech.NOUN)

        # 6 cases × 2 numbers = 12 combinations
        assert len(features) == 12

        # Check that all are sets of size 2 (case + number)
        assert all(len(f) == 2 for f in features)

        # Verify specific combinations exist
        assert {"sing", "nomn"} in features
        assert {"plur", "gent"} in features
        assert {"sing", "loct"} in features

    def test_derive_features_for_adjective(self):
        """Test that adjective features match noun features."""
        features = derive_features(PartOfSpeech.ADJ)

        # Same as nouns: 6 cases × 2 numbers = 12 combinations
        assert len(features) == 12
        assert {"sing", "nomn"} in features
        assert {"plur", "accs"} in features

    def test_derive_features_for_verb(self):
        """Test that verb features include all person/number combinations."""
        features = derive_features(PartOfSpeech.VERB)

        # 3 persons × 2 numbers = 6 combinations
        assert len(features) == 6

        # Check that all are sets of size 2 (person + number)
        assert all(len(f) == 2 for f in features)

        # Verify specific combinations exist
        assert {"1per", "sing"} in features
        assert {"2per", "plur"} in features
        assert {"3per", "sing"} in features

    def test_derive_features_for_auxiliary(self):
        """Test that auxiliary verb features match regular verb features."""
        features = derive_features(PartOfSpeech.AUX)

        # Same as verbs: 3 persons × 2 numbers = 6 combinations
        assert len(features) == 6
        assert {"1per", "sing"} in features

    def test_derive_features_raises_for_unsupported_pos(self):
        """Test that unsupported POS raises ValueError."""

        # Create a mock unsupported POS
        class UnsupportedPOS:
            pass

        with pytest.raises(ValueError) as exc_info:
            derive_features(UnsupportedPOS())

        assert "Unsupported part of speech" in str(exc_info.value)

    def test_noun_features_contain_all_cases(self):
        """Test that all six Russian cases are represented for nouns."""
        features = derive_features(PartOfSpeech.NOUN)

        # Flatten all feature sets
        all_values = set()
        for feature_set in features:
            all_values.update(feature_set)

        # Check all cases are present
        expected_cases = {"nomn", "gent", "datv", "accs", "ablt", "loct"}
        assert expected_cases.issubset(all_values)

    def test_noun_features_contain_both_numbers(self):
        """Test that both singular and plural are represented."""
        features = derive_features(PartOfSpeech.NOUN)

        all_values = set()
        for feature_set in features:
            all_values.update(feature_set)

        assert "sing" in all_values
        assert "plur" in all_values

    def test_verb_features_contain_all_persons(self):
        """Test that all three persons are represented for verbs."""
        features = derive_features(PartOfSpeech.VERB)

        all_values = set()
        for feature_set in features:
            all_values.update(feature_set)

        assert "1per" in all_values
        assert "2per" in all_values
        assert "3per" in all_values


class TestMapToStandardizedFeatures:
    """Tests for the map_to_standardized_features function."""

    def test_maps_case_features(self):
        """Test mapping of case features."""
        result = map_to_standardized_features({"nomn"})
        assert Case.NOM in result

        result = map_to_standardized_features({"gent"})
        assert Case.GEN in result

        result = map_to_standardized_features({"datv"})
        assert Case.DAT in result

        result = map_to_standardized_features({"accs"})
        assert Case.ACC in result

        result = map_to_standardized_features({"ablt"})
        assert Case.ABL in result

        result = map_to_standardized_features({"loct"})
        assert Case.LOC in result

    def test_maps_number_features(self):
        """Test mapping of number features."""
        result = map_to_standardized_features({"sing"})
        assert Number.SING in result

        result = map_to_standardized_features({"plur"})
        assert Number.PLUR in result

    def test_maps_person_features(self):
        """Test mapping of person features."""
        result = map_to_standardized_features({"1per"})
        assert Person.FIRST in result

        result = map_to_standardized_features({"2per"})
        assert Person.SECOND in result

        result = map_to_standardized_features({"3per"})
        assert Person.THIRD in result

    def test_maps_gender_features(self):
        """Test mapping of gender features."""
        result = map_to_standardized_features({"masc"})
        assert Gender.MASC in result

        result = map_to_standardized_features({"femn"})
        assert Gender.FEM in result

        result = map_to_standardized_features({"neut"})
        assert Gender.NEUT in result

    def test_maps_tense_features(self):
        """Test mapping of tense features."""
        result = map_to_standardized_features({"past"})
        assert Tense.PAST in result

        result = map_to_standardized_features({"pres"})
        assert Tense.PRES in result

        result = map_to_standardized_features({"futr"})
        assert Tense.FUT in result

    def test_maps_multiple_features(self):
        """Test mapping of multiple features at once."""
        result = map_to_standardized_features({"sing", "nomn"})

        assert len(result) == 2
        assert Number.SING in result
        assert Case.NOM in result

    def test_ignores_unknown_features(self):
        """Test that unknown features are silently ignored."""
        result = map_to_standardized_features({"sing", "unknown_feature", "nomn"})

        assert len(result) == 2
        assert Number.SING in result
        assert Case.NOM in result

    def test_empty_input_returns_empty_set(self):
        """Test that empty input returns empty set."""
        result = map_to_standardized_features(set())
        assert result == set()

    def test_all_unknown_features_returns_empty_set(self):
        """Test that all unknown features returns empty set."""
        result = map_to_standardized_features({"unknown1", "unknown2"})
        assert result == set()


class TestGetFeature:
    """Tests for the _get_feature helper function."""

    def test_returns_case_for_case_value(self):
        """Test that case values return Case enum members."""
        assert _get_feature("nomn") == Case.NOM
        assert _get_feature("gent") == Case.GEN

    def test_returns_number_for_number_value(self):
        """Test that number values return Number enum members."""
        assert _get_feature("sing") == Number.SING
        assert _get_feature("plur") == Number.PLUR

    def test_returns_person_for_person_value(self):
        """Test that person values return Person enum members."""
        assert _get_feature("1per") == Person.FIRST
        assert _get_feature("2per") == Person.SECOND
        assert _get_feature("3per") == Person.THIRD

    def test_returns_gender_for_gender_value(self):
        """Test that gender values return Gender enum members."""
        assert _get_feature("masc") == Gender.MASC
        assert _get_feature("femn") == Gender.FEM
        assert _get_feature("neut") == Gender.NEUT

    def test_returns_tense_for_tense_value(self):
        """Test that tense values return Tense enum members."""
        assert _get_feature("past") == Tense.PAST
        assert _get_feature("pres") == Tense.PRES
        assert _get_feature("futr") == Tense.FUT

    def test_returns_none_for_unknown_value(self):
        """Test that unknown values return None."""
        assert _get_feature("unknown") is None
        assert _get_feature("") is None
        assert _get_feature("NOMN") is None  # Case sensitive


class TestGetEnumMember:
    """Tests for the _get_enum_member helper function."""

    def test_finds_matching_member(self):
        """Test finding a matching enum member."""
        result = _get_enum_member(Case, "nomn")
        assert result == Case.NOM

    def test_returns_none_for_no_match(self):
        """Test returning None when no match found."""
        result = _get_enum_member(Case, "nonexistent")
        assert result is None

    def test_works_with_different_enums(self):
        """Test that it works with different enum types."""
        assert _get_enum_member(Number, "sing") == Number.SING
        assert _get_enum_member(Person, "1per") == Person.FIRST
        assert _get_enum_member(Gender, "masc") == Gender.MASC


class TestFeatureEnumValues:
    """Tests to verify feature enum values match pymorphy3 tags."""

    def test_case_values(self):
        """Verify Case enum values match pymorphy3 case tags."""
        assert Case.NOM.value == "nomn"
        assert Case.GEN.value == "gent"
        assert Case.DAT.value == "datv"
        assert Case.ACC.value == "accs"
        assert Case.ABL.value == "ablt"
        assert Case.LOC.value == "loct"

    def test_number_values(self):
        """Verify Number enum values match pymorphy3 number tags."""
        assert Number.SING.value == "sing"
        assert Number.PLUR.value == "plur"

    def test_person_values(self):
        """Verify Person enum values match pymorphy3 person tags."""
        assert Person.FIRST.value == "1per"
        assert Person.SECOND.value == "2per"
        assert Person.THIRD.value == "3per"

    def test_gender_values(self):
        """Verify Gender enum values match pymorphy3 gender tags."""
        assert Gender.MASC.value == "masc"
        assert Gender.FEM.value == "femn"
        assert Gender.NEUT.value == "neut"

    def test_tense_values(self):
        """Verify Tense enum values match pymorphy3 tense tags."""
        assert Tense.PAST.value == "past"
        assert Tense.PRES.value == "pres"
        assert Tense.FUT.value == "futr"
