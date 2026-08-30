"""
Tests for reading the artifact.

The assertions that matter here are about the tri-state `inflections` field,
which is the whole reason the feature exists: a list, an explicit ``None`` for a
word that does not inflect, and no entry at all for a word that is unknown are
three different answers.
"""

import store


def one(language: str, norm: str, pos: str | None = None) -> dict:
    entries = store.lookup(language, norm, pos)
    assert len(entries) == 1, f"expected one entry for {norm!r}, got {len(entries)}"
    return entries[0]


class TestLookup:
    def test_unknown_word_returns_no_entries(self):
        assert store.lookup("ru", "несуществующее") == []

    def test_normalised_query_matches_a_stressed_headword(self):
        entry = one("ru", "быстро")
        assert entry["lemma"] == "быстро"
        assert entry["accented"] == "бы́стро"

    def test_pos_filter_narrows_a_homograph(self):
        assert one("ru", "стать", "NOUN")["partOfSpeech"] == "NOUN"
        assert one("ru", "стать", "VERB")["partOfSpeech"] == "VERB"

    def test_homographs_are_returned_as_a_choice(self):
        """
        The old form had to answer with a single paradigm or an error. Offering
        both readings is the point of the change.
        """
        entries = store.lookup("ru", "стать")
        assert [e["partOfSpeech"] for e in entries] == ["NOUN", "VERB"]

    def test_results_are_ordered_by_part_of_speech_rank(self):
        entries = store.lookup("ru", "стать")
        assert entries[0]["partOfSpeech"] == "NOUN"


class TestSenses:
    def test_glosses_come_back_in_order_with_tags(self):
        entry = one("ru", "стол")
        assert [s["gloss"] for s in entry["senses"]] == [
            "table (piece of furniture)",
            "board, diet, cuisine",
        ]
        assert entry["senses"][1]["tags"] == ["figurative"]

    def test_an_uninflected_word_still_has_senses(self):
        entry = one("ru", "быстро")
        assert entry["senses"] == [{"gloss": "quickly, fast", "tags": []}]


class TestInflections:
    def test_a_noun_carries_its_paradigm_and_inherent_gender(self):
        entry = one("ru", "стол")
        assert entry["lemmaFeatures"] == [
            {"type": "GENDER", "value": "MASC"},
            {"type": "ANIMACY", "value": "INAN"},
        ]
        assert len(entry["inflections"]) == 12

    def test_every_inflection_carries_the_lemma(self):
        """`InflectionSchema` requires it, and flashcards are created from it."""
        entry = one("ru", "стол")
        assert all(i["lemma"] == "стол" for i in entry["inflections"])

    def test_an_adverb_has_inflections_none_not_empty(self):
        """
        ``None`` says "this word does not inflect", which is a real answer. An
        empty list would be indistinguishable from a table that failed to extract.
        """
        assert one("ru", "быстро")["inflections"] is None

    def test_an_indeclinable_noun_is_marked_and_has_no_paradigm(self):
        entry = one("ru", "кофе")
        assert entry["inflections"] is None
        assert {"type": "OTHER", "value": "INDECLINABLE"} in entry["lemmaFeatures"]

    def test_an_adjective_has_gendered_cells_and_no_inherent_gender(self):
        entry = one("ru", "новый")
        assert entry["lemmaFeatures"] == []
        assert any(
            f == {"type": "GENDER", "value": "FEM"}
            for i in entry["inflections"]
            for f in i["features"]
        )

    def test_participles_and_imperatives_are_absent_from_the_paradigm(self):
        entry = one("ru", "идти")
        forms = {i["inflected"] for i in entry["inflections"]}
        assert "идущий" not in forms
        assert "иди" not in forms

    def test_stress_is_available_per_cell_without_polluting_the_form(self):
        entry = one("ru", "стол")
        genitive = next(
            i
            for i in entry["inflections"]
            if {"type": "CASE", "value": "GEN"} in i["features"]
            and {"type": "NUMBER", "value": "SING"} in i["features"]
        )
        assert genitive["inflected"] == "стола"
        assert genitive["accented"] == "стола́"


class TestMetadata:
    def test_provenance_is_readable(self):
        meta = store.metadata("ru")
        assert meta["license"] == "CC BY-SA 4.0"
        assert meta["language"] == "ru"


class TestConnectionCaching:
    def test_the_connection_is_reused_across_lookups(self):
        first = store.connect("ru")
        assert store.connect("ru") is first

    def test_a_missing_artifact_and_no_bucket_is_reported_clearly(self, monkeypatch):
        monkeypatch.setattr(store, "CACHE_DIR", "/tmp/definitely-not-here")
        monkeypatch.delenv(store.BUCKET_ENV, raising=False)
        store.reset()
        try:
            store.connect("ru")
        except store.ArtifactUnavailable as e:
            assert store.BUCKET_ENV in str(e)
        else:
            raise AssertionError("expected ArtifactUnavailable")
