"""
Tests for the Russian tag mapping.

The assertions here are about a contract that spans two languages: the values
this mapper emits are the strings `InflectionsTable` matches cells on, so a
rename on either side has to break a test rather than silently empty a column.
"""

from tag_mapping.base import Feature, normalise, strip_accents
from tag_mapping.ru import RussianTagMapper

STRESSED_TABLE = "стола́"


def mapper() -> RussianTagMapper:
    return RussianTagMapper()


class TestLemmaFeatures:
    def test_noun_gender_is_inherent(self):
        features = mapper().lemma_features("NOUN", ["masculine", "inanimate"])
        assert features == [
            Feature("GENDER", "MASC"),
            Feature("ANIMACY", "INAN"),
        ]

    def test_adjective_gender_is_not_inherent(self):
        """
        Gender on an adjective is a paradigm dimension, so a head tag naming one
        is describing the citation form and must not leak onto the lexeme.
        """
        assert mapper().lemma_features("ADJ", ["masculine"]) == []

    def test_verb_aspect_is_inherent(self):
        features = mapper().lemma_features("VERB", ["imperfective", "intransitive"])
        assert features == [Feature("ASPECT", "IMPF")]

    def test_indeclinable_is_recorded(self):
        features = mapper().lemma_features(
            "NOUN", ["masculine", "inanimate", "indeclinable"]
        )
        assert Feature("OTHER", "INDECLINABLE") in features
        assert features[-1] == Feature("OTHER", "INDECLINABLE")

    def test_features_are_ordered_gender_animacy_aspect(self):
        features = mapper().lemma_features("NOUN", ["inanimate", "masculine"])
        assert [f.type for f in features] == ["GENDER", "ANIMACY"]

    def test_duplicate_tags_collapse(self):
        features = mapper().lemma_features("NOUN", ["masculine", "masculine"])
        assert features == [Feature("GENDER", "MASC")]

    def test_unknown_head_tags_are_dropped(self):
        assert mapper().lemma_features("VERB", ["transitive", "class-1a"]) == []


class TestMapForm:
    def test_case_and_number_become_a_cell(self):
        form = mapper().map_form({"form": STRESSED_TABLE, "tags": ["genitive", "singular"]})
        assert form is not None
        assert form.is_cell is True
        assert form.features == [Feature("CASE", "GEN"), Feature("NUMBER", "SING")]

    def test_stress_is_split_off_for_lookup_but_kept_for_display(self):
        form = mapper().map_form({"form": STRESSED_TABLE, "tags": ["genitive", "singular"]})
        assert form.form == "стола"
        assert form.accented == STRESSED_TABLE
        assert form.norm == "стола"

    def test_accented_is_none_when_unstressed(self):
        form = mapper().map_form({"form": "стол", "tags": ["nominative", "singular"]})
        assert form.accented is None

    def test_instrumental_maps_to_abl_and_prepositional_to_loc(self):
        """grammr's case inventory names these ABL and LOC; see feature-labels.ts."""
        instrumental = mapper().map_form({"form": "столом", "tags": ["instrumental"]})
        prepositional = mapper().map_form({"form": "столе", "tags": ["prepositional"]})
        assert Feature("CASE", "ABL") in instrumental.features
        assert Feature("CASE", "LOC") in prepositional.features

    def test_person_and_tense(self):
        form = mapper().map_form(
            {"form": "иду", "tags": ["first-person", "singular", "present"]}
        )
        assert form.features == [
            Feature("PERSON", "FIRST"),
            Feature("NUMBER", "SING"),
            Feature("TENSE", "PRES"),
        ]
        assert form.is_cell is True

    def test_yo_is_normalised_for_lookup_only(self):
        form = mapper().map_form({"form": "идёт", "tags": ["third-person", "singular"]})
        assert form.form == "идёт"
        assert form.norm == "идет"

    def test_placeholder_forms_are_dropped(self):
        for value in ("-", "", "no-table-tags", "not used"):
            assert mapper().map_form({"form": value, "tags": ["nominative"]}) is None

    def test_missing_form_key_is_dropped(self):
        assert mapper().map_form({"tags": ["nominative"]}) is None


class TestCellExclusion:
    def test_romanization_is_not_a_cell(self):
        form = mapper().map_form({"form": "stol", "tags": ["romanization"]})
        assert form is not None
        assert form.is_cell is False
        assert form.features == []

    def test_inflection_template_is_not_a_cell(self):
        form = mapper().map_form(
            {"form": "ru-noun-table", "tags": ["inflection-template"]}
        )
        assert form.is_cell is False

    def test_participle_is_kept_but_not_a_cell(self):
        """
        A past participle carries (tense, gender, number) and would otherwise be
        free to win a cell lookup against the real form.
        """
        form = mapper().map_form(
            {"form": "идущий", "tags": ["participle", "present", "active"]}
        )
        assert form is not None
        assert form.is_cell is False

    def test_short_adjective_is_not_a_cell(self):
        form = mapper().map_form({"form": "нов", "tags": ["short", "masculine", "singular"]})
        assert form.is_cell is False

    def test_imperative_is_not_a_cell(self):
        assert mapper().map_form({"form": "иди", "tags": ["imperative", "singular"]}).is_cell is False

    def test_a_form_with_only_unknown_tags_is_not_a_cell(self):
        """
        Otherwise it maps to a lone OTHER feature and pins down no coordinate,
        leaving it free to satisfy any lookup.
        """
        form = mapper().map_form({"form": "столе", "tags": ["colloquial"]})
        assert form.features == [Feature("OTHER", "COLLOQUIAL")]
        assert form.is_cell is False

    def test_unknown_tags_survive_alongside_known_ones(self):
        form = mapper().map_form(
            {"form": "столу", "tags": ["dative", "singular", "colloquial"]}
        )
        assert Feature("OTHER", "COLLOQUIAL") in form.features
        assert form.is_cell is True

    def test_raw_tags_are_preserved_verbatim(self):
        tags = ["participle", "present", "active"]
        form = mapper().map_form({"form": "идущий", "tags": tags})
        assert form.raw_tags == tags


class TestNormalisation:
    def test_yo_is_not_treated_as_accented_e(self):
        """
        A blanket combining-mark strip would turn ``ё`` into ``е``, which is a
        different letter and not a stress mark.
        """
        assert strip_accents("идёт") == "идёт"

    def test_normalise_folds_case_stress_and_yo(self):
        assert normalise("Идё́т") == "идет"

    def test_normalise_trims(self):
        assert normalise("  стол  ") == "стол"
