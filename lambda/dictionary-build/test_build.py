"""
End-to-end tests for the artifact build, run against a committed fixture slice of
a real wiktextract dump (`fixtures/ru-sample.jsonl`).

These are the tests that catch the failures that matter: a paradigm cell that
does not line up with what `InflectionsTable` looks for, a stub entry that turns
into a blank dictionary result, or a participle that steals a cell.
"""

import json
import sqlite3
from pathlib import Path

import pytest

from build import build, sort_cells
from tag_mapping.base import Feature, MappedForm

FIXTURE = str(Path(__file__).parent / "fixtures" / "ru-sample.jsonl")


@pytest.fixture(scope="module")
def artifact(tmp_path_factory) -> Path:
    out = tmp_path_factory.mktemp("dict") / "ru.sqlite"
    build(FIXTURE, "ru", out)
    return out


@pytest.fixture(scope="module")
def db(artifact) -> sqlite3.Connection:
    connection = sqlite3.connect(artifact)
    connection.row_factory = sqlite3.Row
    yield connection
    connection.close()


def lexeme(db: sqlite3.Connection, lemma: str, pos: str) -> sqlite3.Row:
    row = db.execute(
        "SELECT * FROM lexeme WHERE lemma = ? AND pos = ?", (lemma, pos)
    ).fetchone()
    assert row is not None, f"no {pos} lexeme for {lemma!r}"
    return row


def cells(db: sqlite3.Connection, lexeme_id: int) -> list[dict]:
    rows = db.execute(
        "SELECT form, features FROM form WHERE lexeme_id = ? AND is_cell = 1 ORDER BY ord",
        (lexeme_id,),
    ).fetchall()
    return [{"form": r["form"], "features": json.loads(r["features"])} for r in rows]


def find_cell(cell_rows: list[dict], **target) -> dict | None:
    """Mirrors `findInflection` in inflections-table.tsx, including first-match-wins."""
    for row in cell_rows:
        if all(
            any(f["type"] == t and f["value"] == v for f in row["features"])
            for t, v in target.items()
        ):
            return row
    return None


class TestProvenance:
    def test_licence_and_source_are_recorded(self, db):
        meta = dict(db.execute("SELECT key, value FROM meta").fetchall())
        assert meta["language"] == "ru"
        assert meta["license"] == "CC BY-SA 4.0"
        assert "wiktextract" in meta["source"]


class TestFiltering:
    def test_other_languages_are_excluded(self, db):
        assert db.execute(
            "SELECT count(*) FROM lexeme WHERE lemma = 'table'"
        ).fetchone()[0] == 0

    def test_glossless_stubs_are_skipped(self, db):
        """
        ``столы`` appears only as a form-of stub with no gloss. A dictionary entry
        without a definition is not an entry; it is reachable via its lemma.
        """
        assert db.execute(
            "SELECT count(*) FROM lexeme WHERE lemma = 'столы'"
        ).fetchone()[0] == 0

    def test_homographs_are_separate_lexemes(self, db):
        rows = db.execute(
            "SELECT pos FROM lexeme WHERE norm = 'стать' ORDER BY pos"
        ).fetchall()
        assert [r["pos"] for r in rows] == ["NOUN", "VERB"]


class TestNoun:
    def test_gender_and_animacy_are_inherent(self, db):
        row = lexeme(db, "стол", "NOUN")
        assert json.loads(row["lemma_features"]) == [
            {"type": "GENDER", "value": "MASC"},
            {"type": "ANIMACY", "value": "INAN"},
        ]

    def test_lemma_is_plain_and_accented_is_kept_separately(self, db):
        row = lexeme(db, "стол", "NOUN")
        assert row["lemma"] == "стол"
        assert row["norm"] == "стол"
        # The headword carries no stress mark of its own; the canonical form does.
        assert row["lemma_accented"] == "сто́л"

    def test_every_case_and_number_cell_resolves(self, db):
        row = lexeme(db, "стол", "NOUN")
        cell_rows = cells(db, row["id"])
        for case in ("NOM", "GEN", "DAT", "ACC", "ABL", "LOC"):
            for number in ("SING", "PLUR"):
                found = find_cell(cell_rows, CASE=case, NUMBER=number)
                assert found is not None, f"missing {case}/{number}"

    def test_declension_matches_the_dump(self, db):
        row = lexeme(db, "стол", "NOUN")
        cell_rows = cells(db, row["id"])
        assert find_cell(cell_rows, CASE="GEN", NUMBER="SING")["form"] == "стола"
        assert find_cell(cell_rows, CASE="ABL", NUMBER="SING")["form"] == "столом"
        assert find_cell(cell_rows, CASE="LOC", NUMBER="PLUR")["form"] == "столах"

    def test_empty_partitive_cell_is_dropped(self, db):
        row = lexeme(db, "стол", "NOUN")
        cell_rows = cells(db, row["id"])
        assert find_cell(cell_rows, CASE="PART") is None

    def test_romanization_and_template_rows_are_not_cells(self, db):
        row = lexeme(db, "стол", "NOUN")
        cell_forms = {c["form"] for c in cells(db, row["id"])}
        assert "stol" not in cell_forms
        assert "ru-noun-table" not in cell_forms

    def test_canonical_row_is_not_duplicated_as_a_form(self, db):
        row = lexeme(db, "стол", "NOUN")
        stored = db.execute(
            "SELECT raw_tags FROM form WHERE lexeme_id = ?", (row["id"],)
        ).fetchall()
        assert all("canonical" not in json.loads(r["raw_tags"]) for r in stored)


class TestAdjective:
    def test_gender_is_inflectional_not_inherent(self, db):
        row = lexeme(db, "новый", "ADJ")
        assert json.loads(row["lemma_features"]) == []

    def test_gendered_singular_cells_resolve(self, db):
        row = lexeme(db, "новый", "ADJ")
        cell_rows = cells(db, row["id"])
        assert find_cell(cell_rows, CASE="NOM", NUMBER="SING", GENDER="MASC")["form"] == "новый"
        assert find_cell(cell_rows, CASE="NOM", NUMBER="SING", GENDER="FEM")["form"] == "новая"
        assert find_cell(cell_rows, CASE="NOM", NUMBER="SING", GENDER="NEUT")["form"] == "новое"

    def test_plural_has_no_gender(self, db):
        row = lexeme(db, "новый", "ADJ")
        cell_rows = cells(db, row["id"])
        plural = find_cell(cell_rows, CASE="NOM", NUMBER="PLUR")
        assert plural["form"] == "новые"
        assert not any(f["type"] == "GENDER" for f in plural["features"])

    def test_short_form_does_not_win_a_gendered_cell(self, db):
        """
        ``нов`` is tagged (short, masculine, singular) -- it must not be able to
        satisfy a lookup for nominative masculine singular.
        """
        row = lexeme(db, "новый", "ADJ")
        cell_rows = cells(db, row["id"])
        assert "нов" not in {c["form"] for c in cell_rows}

    def test_comparative_is_kept_out_of_the_grid_but_stored(self, db):
        row = lexeme(db, "новый", "ADJ")
        stored = {
            r["form"]: r["is_cell"]
            for r in db.execute(
                "SELECT form, is_cell FROM form WHERE lexeme_id = ?", (row["id"],)
            )
        }
        assert stored["новее"] == 0


class TestVerb:
    def test_aspect_is_inherent(self, db):
        row = lexeme(db, "идти", "VERB")
        assert json.loads(row["lemma_features"]) == [
            {"type": "ASPECT", "value": "IMPF"}
        ]

    def test_present_wins_over_compound_future_for_the_same_cell(self, db):
        """
        Both ``иду`` (present) and ``буду идти`` (future) are tagged first-person
        singular. The table resolves a cell with first-match-wins, so the present
        has to be stored first or an imperfective verb shows its future forms.
        """
        row = lexeme(db, "идти", "VERB")
        cell_rows = cells(db, row["id"])
        assert find_cell(cell_rows, PERSON="FIRST", NUMBER="SING")["form"] == "иду"

    def test_every_person_and_number_cell_resolves(self, db):
        row = lexeme(db, "идти", "VERB")
        cell_rows = cells(db, row["id"])
        for person in ("FIRST", "SECOND", "THIRD"):
            for number in ("SING", "PLUR"):
                assert find_cell(cell_rows, PERSON=person, NUMBER=number) is not None

    def test_past_forms_do_not_satisfy_a_person_lookup(self, db):
        row = lexeme(db, "идти", "VERB")
        cell_rows = cells(db, row["id"])
        past = {"шёл", "шла"}
        for person in ("FIRST", "SECOND", "THIRD"):
            for number in ("SING", "PLUR"):
                found = find_cell(cell_rows, PERSON=person, NUMBER=number)
                assert found["form"] not in past

    def test_participle_and_imperative_are_stored_but_not_cells(self, db):
        row = lexeme(db, "идти", "VERB")
        stored = {
            r["form"]: r["is_cell"]
            for r in db.execute(
                "SELECT form, is_cell FROM form WHERE lexeme_id = ?", (row["id"],)
            )
        }
        assert stored["идущий"] == 0
        assert stored["иди"] == 0


class TestUninflected:
    def test_an_adverb_has_senses_and_no_cells(self, db):
        row = lexeme(db, "быстро", "ADV")
        assert row["sense_count"] == 1
        assert cells(db, row["id"]) == []

    def test_an_indeclinable_noun_is_marked_and_has_no_cells(self, db):
        """
        ``кофе`` is a different thing from a noun whose table failed to extract,
        and the entry needs to be able to say so.
        """
        row = lexeme(db, "кофе", "NOUN")
        assert {"type": "OTHER", "value": "INDECLINABLE"} in json.loads(
            row["lemma_features"]
        )
        assert cells(db, row["id"]) == []


class TestSenses:
    def test_glosses_are_stored_in_order_with_tags(self, db):
        row = lexeme(db, "стол", "NOUN")
        rows = db.execute(
            "SELECT gloss, tags FROM sense WHERE lexeme_id = ? ORDER BY ord",
            (row["id"],),
        ).fetchall()
        assert [r["gloss"] for r in rows] == [
            "table (piece of furniture)",
            "board, diet, cuisine",
        ]
        assert json.loads(rows[1]["tags"]) == ["figurative"]

    def test_sense_count_is_denormalised_onto_the_lexeme(self, db):
        row = lexeme(db, "стол", "NOUN")
        actual = db.execute(
            "SELECT count(*) FROM sense WHERE lexeme_id = ?", (row["id"],)
        ).fetchone()[0]
        assert row["sense_count"] == actual


class TestSortCells:
    def _form(self, name, *features, is_cell=True):
        return MappedForm(
            form=name, accented=None, norm=name, features=list(features), is_cell=is_cell
        )

    def test_cells_sort_before_non_cells(self):
        non_cell = self._form("идущий", is_cell=False)
        cell = self._form("иду", Feature("PERSON", "FIRST"))
        assert sort_cells([non_cell, cell]) == [cell, non_cell]

    def test_present_sorts_before_future_and_past(self):
        past = self._form("шёл", Feature("TENSE", "PAST"))
        future = self._form("буду идти", Feature("TENSE", "FUT"))
        present = self._form("иду", Feature("TENSE", "PRES"))
        assert sort_cells([past, future, present]) == [present, future, past]

    def test_order_is_stable_within_a_rank(self):
        first = self._form("a", Feature("CASE", "NOM"))
        second = self._form("b", Feature("CASE", "GEN"))
        assert sort_cells([first, second]) == [first, second]


class TestIdempotence:
    def test_rebuilding_replaces_rather_than_appends(self, tmp_path):
        out = tmp_path / "ru.sqlite"
        first = build(FIXTURE, "ru", out)
        second = build(FIXTURE, "ru", out)
        assert first == second

    def test_unknown_language_is_rejected(self, tmp_path):
        with pytest.raises(ValueError, match="No tag mapping"):
            build(FIXTURE, "de", tmp_path / "de.sqlite")
