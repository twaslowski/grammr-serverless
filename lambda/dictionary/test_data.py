"""Tests for request parsing and normalisation."""

import pytest

from data import LookupRequest, extract_language, normalise, pos_rank


class TestNormalise:
    def test_folds_case(self):
        assert normalise("Стол") == "стол"

    def test_strips_stress_marks(self):
        assert normalise("стола́") == "стола"

    def test_collapses_yo_onto_e(self):
        """Learners type ``идет`` far more often than ``идёт``."""
        assert normalise("идёт") == "идет"

    def test_trims_surrounding_space(self):
        assert normalise("  стол\n") == "стол"

    def test_matches_the_builders_normalisation(self):
        """
        The stored `norm` columns were written by the builder's `normalise`, so a
        divergence here means every lookup silently misses.
        """
        import importlib.util
        from pathlib import Path

        base = (
            Path(__file__).resolve().parent.parent
            / "dictionary-build"
            / "tag_mapping"
            / "base.py"
        )
        spec = importlib.util.spec_from_file_location("builder_base", base)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        for word in ("Стол", "стола́", "идёт", "Идё́т", "  кофе "):
            assert normalise(word) == module.normalise(word)


class TestLookupRequest:
    def test_parses_a_query(self):
        request = LookupRequest.from_event({"body": '{"query": "стол"}'})
        assert request.query == "стол"
        assert request.norm == "стол"
        assert request.pos is None

    def test_pos_is_optional_and_upper_cased(self):
        request = LookupRequest.from_event({"body": '{"query": "стать", "pos": "noun"}'})
        assert request.pos == "NOUN"

    def test_blank_pos_is_treated_as_absent(self):
        assert LookupRequest.from_event({"body": '{"query": "стол", "pos": "  "}'}).pos is None

    @pytest.mark.parametrize("body", ['{"query": ""}', '{"query": "   "}', "{}"])
    def test_empty_query_is_rejected(self, body):
        with pytest.raises(ValueError, match="Query cannot be empty"):
            LookupRequest.from_event({"body": body})

    def test_query_of_only_stress_marks_is_rejected(self):
        with pytest.raises(ValueError, match="no searchable characters"):
            LookupRequest("́")

    def test_overlong_query_is_rejected(self):
        with pytest.raises(ValueError, match="too long"):
            LookupRequest("а" * 65)

    def test_malformed_json_is_a_value_error(self):
        """
        Not a bare crash: `lambda/inflections-ru` intended to turn this into a 400
        and does not, because its `except` clause names a union type and a decoder
        class rather than exceptions.
        """
        with pytest.raises(ValueError, match="not valid JSON"):
            LookupRequest.from_event({"body": "{not json"})

    def test_non_object_body_is_rejected(self):
        with pytest.raises(ValueError, match="must be a JSON object"):
            LookupRequest.from_event({"body": "[1, 2]"})

    def test_missing_body_is_rejected_as_empty(self):
        with pytest.raises(ValueError, match="Query cannot be empty"):
            LookupRequest.from_event({})


class TestExtractLanguage:
    def test_reads_the_last_path_segment(self):
        assert extract_language({"rawPath": "/dictionary/ru"}) == "ru"

    def test_tolerates_a_trailing_slash(self):
        assert extract_language({"rawPath": "/dictionary/ru/"}) == "ru"

    def test_falls_back_to_path(self):
        assert extract_language({"path": "/dictionary/RU"}) == "ru"

    def test_unsupported_language_is_rejected(self):
        with pytest.raises(ValueError, match="Unsupported language"):
            extract_language({"rawPath": "/dictionary/de"})


class TestPosRank:
    def test_content_words_outrank_function_words(self):
        assert pos_rank("NOUN") < pos_rank("PART")

    def test_unknown_pos_ranks_last(self):
        assert pos_rank("X") > pos_rank("INTJ")
