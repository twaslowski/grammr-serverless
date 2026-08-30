"""
Request and response shapes for the dictionary service.

Plain classes with explicit validation, following `lambda/translate/data.py`
rather than the pydantic models the container-image Lambdas use: this function is
zip-packaged, and the whole point of it having no dependencies is that the
artifact stays a few kilobytes.
"""

import json
import unicodedata

#: Languages with a published artifact. Adding one means building its SQLite file
#: and adding a gateway route; the code here is language-agnostic.
SUPPORTED_LANGUAGES = ["ru"]

#: Combining acute accent, used by Russian Wiktionary to mark stress.
COMBINING_ACUTE = "\u0301"

#: Ranking of parts of speech when a query matches several lexemes. A learner who
#: types a word almost always wants the content word, not the affix or the
#: unclassifiable leftover, and putting that ordering here rather than in the SQL
#: keeps it visible next to the rest of the contract.
POS_RANK = {
    "NOUN": 0,
    "VERB": 1,
    "ADJ": 2,
    "ADV": 3,
    "PRON": 4,
    "NUM": 5,
    "ADP": 6,
    "CCONJ": 7,
    "SCONJ": 7,
    "PART": 8,
    "DET": 8,
    "INTJ": 9,
    "PROPN": 10,
    "AUX": 11,
}
UNRANKED_POS = 50

MAX_RESULTS = 25


def normalise(text: str) -> str:
    """
    Build the lookup key for a query.

    Must stay in step with `normalise` in `lambda/dictionary-build/tag_mapping/base.py`,
    which is what the stored `norm` columns were built with: stress marks go, case
    is folded, and ``ё`` collapses onto ``е``.

    Only the combining acute is stripped, not every combining mark, because ``ё``
    is a distinct letter rather than an accented ``е``.
    """
    decomposed = unicodedata.normalize("NFD", text)
    without_stress = decomposed.replace(COMBINING_ACUTE, "")
    recomposed = unicodedata.normalize("NFC", without_stress)
    return recomposed.casefold().replace("ё", "е").strip()


class LookupRequest:
    """A dictionary lookup."""

    def __init__(self, query: str, pos: str | None = None):
        if not isinstance(query, str) or not query.strip():
            raise ValueError("Query cannot be empty")

        normalised = normalise(query)
        if not normalised:
            raise ValueError("Query contains no searchable characters")
        if len(normalised) > 64:
            raise ValueError("Query is too long")

        self.query = query.strip()
        self.norm = normalised
        # A part of speech narrows the result list when the caller already knows
        # it -- the morphology service does, for instance. It is never required,
        # which is the whole difference from the inflections endpoint.
        self.pos = pos.upper() if isinstance(pos, str) and pos.strip() else None

    @classmethod
    def from_event(cls, event: dict) -> "LookupRequest":
        try:
            body = json.loads(event.get("body") or "{}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Body is not valid JSON: {e}") from e
        if not isinstance(body, dict):
            raise ValueError("Body must be a JSON object")
        return cls(query=body.get("query"), pos=body.get("pos"))


def extract_language(event: dict) -> str:
    """
    Read the target language out of the request path.

    The gateway routes `POST /dictionary/{language}` to this function, so the
    language arrives in the path rather than the payload -- the same arrangement
    as `/inflections/{language}` and `/morphology/{language}`.
    """
    path = event.get("rawPath") or event.get("path") or ""
    candidate = path.rstrip("/").rsplit("/", 1)[-1].lower()
    if candidate not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language: {candidate!r}")
    return candidate


def pos_rank(pos: str) -> int:
    return POS_RANK.get(pos, UNRANKED_POS)
