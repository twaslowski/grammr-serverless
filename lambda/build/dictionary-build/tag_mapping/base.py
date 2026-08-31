"""
Language-independent parts of the tag mapping.

The pieces here are the ones that do not depend on which language's inflection
tables are being read: the feature record itself, the Wiktionary-to-Universal
Dependencies part-of-speech table, and the set of tags that mean "this row is
not a cell of the main paradigm".
"""

import unicodedata
from dataclasses import dataclass, field

#: Combining acute accent. Russian Wiktionary marks stress with it
#: (``стола́``), which is useful to display but must not be part of a lookup key.
COMBINING_ACUTE = "\u0301"

#: Wiktionary's part-of-speech strings, mapped onto the Universal Dependencies
#: tags used throughout grammr. Anything absent falls through to ``X``, which
#: `PartOfSpeechEnum` in `src/types/inflections.ts` already treats as the
#: catch-all, so an unmapped POS degrades to "no inflection table" rather than
#: to an error.
POS_MAP = {
    "adj": "ADJ",
    "adv": "ADV",
    "article": "DET",
    "character": "SYM",
    "conj": "CCONJ",
    "det": "DET",
    "intj": "INTJ",
    "name": "PROPN",
    "noun": "NOUN",
    "num": "NUM",
    "particle": "PART",
    "postp": "ADP",
    "prep": "ADP",
    "prep_phrase": "ADP",
    "pron": "PRON",
    "punct": "PUNCT",
    "symbol": "SYM",
    "verb": "VERB",
}

#: Tags that mark a ``forms[]`` row as something other than a paradigm cell.
#:
#: Two kinds are collapsed here. Some are wiktextract bookkeeping that leaks into
#: the form list (``table-tags``, ``inflection-template``, ``class``,
#: ``romanization``). The rest are real word forms that simply have no home in
#: the grids `InflectionsTable` renders -- participles, short adjectives,
#: comparatives, imperatives and the infinitive are all genuinely useful, but
#: none of them is addressed by a (case, number, gender) or (person, number)
#: coordinate. Letting them through would be worse than dropping them: the table
#: looks cells up with `Array.prototype.find`, so a participle tagged
#: ``["past", "masculine", "singular"]`` could win a lookup over the real cell.
#:
#: Rows carrying these tags are still stored, with ``is_cell = 0``, so nothing is
#: lost from the artifact and a richer entry view can surface them later.
EXCLUDED_FROM_CELLS = frozenset(
    {
        # wiktextract bookkeeping
        "table-tags",
        "inflection-template",
        "class",
        "romanization",
        "error-unrecognized-form",
        # real forms, but outside the rendered grids
        "participle",
        "short",
        "comparative",
        "superlative",
        "adverbial",
        "imperative",
        "infinitive",
    }
)

#: Placeholder values wiktextract emits where a table cell is empty or where the
#: row is a template marker rather than a form.
PLACEHOLDER_FORMS = frozenset({"-", "—", "–", "", "no-table-tags", "not used"})


@dataclass(frozen=True)
class Feature:
    """One typed grammatical feature, matching `FeatureSchema` on the frontend."""

    type: str
    value: str

    def json(self) -> dict:
        return {"type": self.type, "value": self.value}


@dataclass
class MappedForm:
    """A single ``forms[]`` row after mapping."""

    form: str
    accented: str | None
    norm: str
    features: list[Feature]
    raw_tags: list[str] = field(default_factory=list)
    is_cell: bool = False


def map_pos(pos: str | None) -> str:
    """Translate a Wiktionary part-of-speech string to a UD tag."""
    if not pos:
        return "X"
    return POS_MAP.get(pos.lower(), "X")


def strip_accents(text: str) -> str:
    """
    Remove stress marks while leaving the letters themselves alone.

    Decomposing and dropping only the combining acute is deliberate: a blanket
    "strip all combining marks" would also destroy ``ё``, which is a distinct
    letter in Russian and not an accented ``е``.
    """
    decomposed = unicodedata.normalize("NFD", text)
    without_stress = decomposed.replace(COMBINING_ACUTE, "")
    return unicodedata.normalize("NFC", without_stress)


def normalise(text: str) -> str:
    """
    Build the lookup key for a headword or form.

    Stress marks go, case is folded, and ``ё`` collapses onto ``е`` -- learners
    type ``идет`` far more often than ``идёт``, and Wiktionary is inconsistent
    about which one a form is stored under.
    """
    return strip_accents(text).casefold().replace("ё", "е").strip()
