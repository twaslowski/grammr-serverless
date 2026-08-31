"""
Tests for the comparison logic behind the confidence gate.

Only the pure parts: the network and the report formatting are exercised by
running the script. What matters here is that a real disagreement is reported as
one and a spurious one is not, because a gate that cries wolf gets ignored and
then it is not a gate.
"""

import sqlite3
from pathlib import Path

import pytest

from build import build
from verify import (
    Comparison,
    cells_of,
    compare,
    coordinate,
    inherent,
    report,
    sample,
)

FIXTURE = str(Path(__file__).parent / "fixtures" / "ru-sample.jsonl")


def features(**axes) -> list[dict]:
    return [{"type": t, "value": v} for t, v in axes.items()]


class TestCoordinate:
    def test_is_order_independent(self):
        a = coordinate(features(CASE="GEN", NUMBER="SING"))
        b = coordinate(features(NUMBER="SING", CASE="GEN"))
        assert a == b

    def test_ignores_axes_a_cell_is_not_addressed_by(self):
        """
        A verb cell is looked up by person and number; its TENSE, and any OTHER
        tag, are not part of its identity. Including them would make every
        comparison a mismatch.
        """
        with_tense = coordinate(features(PERSON="FIRST", NUMBER="SING", TENSE="PRES"))
        without_tense = coordinate(features(PERSON="FIRST", NUMBER="SING"))
        assert with_tense == without_tense

    def test_ignores_other(self):
        assert coordinate(
            features(CASE="NOM", OTHER="COLLOQUIAL")
        ) == coordinate(features(CASE="NOM"))

    def test_is_none_when_no_axis_is_pinned_down(self):
        assert coordinate(features(OTHER="COLLOQUIAL")) is None
        assert coordinate([]) is None


class TestCellsOf:
    def test_first_occurrence_wins(self):
        """
        Mirrors `findInflection`, which resolves a cell with `Array.prototype.find`.
        Comparing anything else would be comparing a form the reader never sees.
        """
        cells = cells_of(
            [
                (features(CASE="NOM", NUMBER="SING"), "первый"),
                (features(CASE="NOM", NUMBER="SING"), "второй"),
            ]
        )
        assert cells["CASE=NOM/NUMBER=SING"] == "первый"

    def test_uncomparable_rows_are_dropped(self):
        assert cells_of([(features(OTHER="X"), "нечто")]) == {}


class TestInherent:
    def test_keeps_only_lexeme_level_features(self):
        assert inherent(
            features(GENDER="MASC", ANIMACY="INAN", CASE="NOM")
        ) == "ANIMACY=INAN/GENDER=MASC"

    def test_is_empty_when_there_are_none(self):
        assert inherent([]) == ""


class TestCompare:
    artifact = {
        "CASE=GEN/NUMBER=SING": "стола",
        "CASE=NOM/NUMBER=SING": "стол",
    }

    def service(self, **forms) -> dict:
        axis_map = {
            "gen_sing": features(CASE="GEN", NUMBER="SING"),
            "nom_sing": features(CASE="NOM", NUMBER="SING"),
        }
        return {
            "lemmaFeatures": features(GENDER="MASC", ANIMACY="INAN"),
            "inflections": [
                {"lemma": "стол", "inflected": form, "features": axis_map[key]}
                for key, form in forms.items()
            ],
        }

    def test_identical_paradigms_agree(self):
        result = compare(
            "стол", "NOUN", self.artifact, "ANIMACY=INAN/GENDER=MASC",
            self.service(gen_sing="стола", nom_sing="стол"),
        )
        assert result.agreed == 2
        assert result.disagreed == {}
        assert result.lemma_features is None

    def test_a_differing_form_is_reported_with_both_readings(self):
        result = compare(
            "стол", "NOUN", self.artifact, "ANIMACY=INAN/GENDER=MASC",
            self.service(gen_sing="столу", nom_sing="стол"),
        )
        assert result.disagreed == {"CASE=GEN/NUMBER=SING": ("стола", "столу")}
        assert result.agreed == 1

    def test_stress_marking_is_not_a_disagreement(self):
        # Both sides are inconsistent about stress; neither inconsistency is what
        # this is looking for.
        result = compare(
            "стол", "NOUN", self.artifact, "ANIMACY=INAN/GENDER=MASC",
            self.service(gen_sing="стола́", nom_sing="стол"),
        )
        assert result.disagreed == {}
        assert result.agreed == 2

    def test_yo_spelling_is_not_a_disagreement(self):
        # Built with `cells_of` rather than hand-written, because coordinates are
        # sorted and `sample()` produces them the same way. A literal key here
        # would test the literal, not the comparison.
        artifact = cells_of([(features(PERSON="THIRD", NUMBER="SING"), "идёт")])
        result = compare(
            "идти", "VERB", artifact, "",
            {
                "lemmaFeatures": [],
                "inflections": [
                    {
                        "lemma": "идти",
                        "inflected": "идет",
                        "features": features(PERSON="THIRD", NUMBER="SING"),
                    }
                ],
            },
        )
        assert result.disagreed == {}
        assert result.agreed == 1

    def test_a_cell_only_the_artifact_has_is_recorded_separately(self):
        # Coverage the dictionary adds, not an error.
        result = compare(
            "стол", "NOUN", self.artifact, "ANIMACY=INAN/GENDER=MASC",
            self.service(nom_sing="стол"),
        )
        assert result.artifact_only == ["CASE=GEN/NUMBER=SING"]
        assert result.disagreed == {}

    def test_a_cell_only_the_service_has_is_recorded_separately(self):
        result = compare(
            "стол", "NOUN", {"CASE=NOM/NUMBER=SING": "стол"},
            "ANIMACY=INAN/GENDER=MASC",
            self.service(gen_sing="стола", nom_sing="стол"),
        )
        assert result.service_only == ["CASE=GEN/NUMBER=SING"]

    def test_differing_inherent_features_are_flagged_even_when_cells_agree(self):
        # The distinction `68c61a8` introduced: a noun's gender is a property of
        # the lexeme, so getting it wrong is invisible in the cells.
        result = compare(
            "стол", "NOUN", self.artifact, "ANIMACY=INAN/GENDER=FEM",
            self.service(gen_sing="стола", nom_sing="стол"),
        )
        assert result.agreed == 2
        assert result.lemma_features == (
            "ANIMACY=INAN/GENDER=FEM",
            "ANIMACY=INAN/GENDER=MASC",
        )

    def test_an_empty_service_response_yields_no_comparisons(self):
        result = compare("стол", "NOUN", self.artifact, "", {})
        assert result.compared == 0
        assert len(result.artifact_only) == 2


@pytest.fixture(scope="module")
def db(tmp_path_factory):
    out = tmp_path_factory.mktemp("verify") / "ru.sqlite"
    build(FIXTURE, "ru", out)
    connection = sqlite3.connect(out)
    connection.row_factory = sqlite3.Row
    yield connection
    connection.close()


class TestSample:
    def test_only_returns_lexemes_that_have_a_paradigm(self, db):
        # An adverb has nothing to compare, so sampling it would only add noise.
        assert sample(db, "ADV", 10) == []

    def test_returns_cells_indexed_by_coordinate(self, db):
        [(lemma, features_, cells)] = sample(db, "NOUN", 1)
        assert lemma == "стол"
        assert features_ == "ANIMACY=INAN/GENDER=MASC"
        assert cells["CASE=GEN/NUMBER=SING"] == "стола"

    def test_respects_the_limit(self, db):
        assert len(sample(db, "NOUN", 1)) == 1

    def test_an_indeclinable_noun_is_not_sampled(self, db):
        lemmas = {lemma for lemma, _, _ in sample(db, "NOUN", 100)}
        assert "кофе" not in lemmas


class TestReport:
    def test_counts_disagreements_across_parts_of_speech(self, capsys):
        results = {
            "NOUN": [
                Comparison("стол", "NOUN", agreed=11, disagreed={"CASE=GEN/NUMBER=SING": ("стола", "столу")}),
            ],
            "VERB": [Comparison("идти", "VERB", agreed=6)],
        }
        assert report(results) == 1

        out = capsys.readouterr().out
        assert "artifact 'стола' vs service 'столу'" in out
        # The rate is reported, but the text says plainly that it is not the bar.
        assert "a low rate" in out

    def test_declined_lookups_are_reported_rather_than_hidden(self, capsys):
        results = {"NOUN": [Comparison("нечто", "NOUN", error="HTTP 400")]}
        report(results)

        out = capsys.readouterr().out
        assert "service declined" in out
        assert "HTTP 400" in out

    def test_does_not_divide_by_zero_when_nothing_was_comparable(self, capsys):
        report({"NOUN": [Comparison("нечто", "NOUN", error="HTTP 400")]})
        assert "cells compared      0" in capsys.readouterr().out
