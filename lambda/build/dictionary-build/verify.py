"""
Compares the artifact's paradigms against the live inflections service.

    API_GW_URL=... API_GW_API_KEY=... python verify.py dist/ru.sqlite

This is the confidence gate for a new or rebuilt artifact. Two sources now claim
to know Russian morphology -- Wiktionary, via `build.py`, and pymorphy3, behind
`POST /inflections/ru` -- and where they disagree, one of them is wrong. Each
disagreement is either a bug in the tag mapping or a genuine divergence between
the two sources, and the point is to have looked at every class of them before
shipping rather than after.

Nothing is written and nothing is mutated: the output is a report.

Sampling is by sense count, descending, as a stand-in for frequency. A word with
many documented senses tends to be a common word, but it is a proxy and not a
good one -- the honest fix is a frequency list, which is also what
`lexeme.sense_count` should eventually give way to. The sample size is reported
alongside the rates so the numbers are not read as more than they are.
"""

import argparse
import json
import logging
import os
import sqlite3
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path

from tag_mapping.base import normalise

#: The axes a cell is addressed by. Features outside these -- an OTHER tag, or a
#: TENSE on a verb cell the table pivots on person and number -- are not part of
#: a cell's identity and would otherwise make every comparison a mismatch.
GRID_AXES = ("CASE", "NUMBER", "GENDER", "PERSON")

#: Only these have a paradigm on both sides worth comparing. AUX is omitted
#: because Wiktionary does not classify Russian verbs that way.
COMPARABLE_POS = ("NOUN", "ADJ", "VERB")

DEFAULT_LIMIT = 2000
DEFAULT_CONCURRENCY = 4
REQUEST_TIMEOUT = 30

logger = logging.getLogger("verify")


@dataclass
class Comparison:
    """The outcome for one lexeme."""

    lemma: str
    pos: str
    agreed: int = 0
    #: coordinate -> (artifact form, service form)
    disagreed: dict[str, tuple[str, str]] = field(default_factory=dict)
    #: Cells the artifact has and the service does not, and vice versa.
    artifact_only: list[str] = field(default_factory=list)
    service_only: list[str] = field(default_factory=list)
    #: Set when the inherent features differ; nouns only, in practice.
    lemma_features: tuple[str, str] | None = None
    #: Set when no comparison was possible at all.
    error: str | None = None

    @property
    def compared(self) -> int:
        return self.agreed + len(self.disagreed)


def coordinate(features: list[dict]) -> str | None:
    """
    Reduce a cell's features to a stable, comparable coordinate.

    Returns ``None`` for a cell that pins down no axis, which cannot be compared
    against anything.
    """
    axes = sorted(
        f"{f['type']}={f['value']}" for f in features if f.get("type") in GRID_AXES
    )
    return "/".join(axes) or None


def cells_of(features_and_forms: list[tuple[list[dict], str]]) -> dict[str, str]:
    """
    Index forms by coordinate, first occurrence winning.

    First-wins mirrors `findInflection` in `inflections-table.tsx`: the table
    resolves a cell with `Array.prototype.find`, so comparing anything else would
    be comparing something the reader never sees.
    """
    cells: dict[str, str] = {}
    for features, form in features_and_forms:
        key = coordinate(features)
        if key is not None and key not in cells:
            cells[key] = form
    return cells


def inherent(features: list[dict]) -> str:
    """The inherent features, as a comparable string. Gender is the one that matters."""
    return "/".join(
        sorted(
            f"{f['type']}={f['value']}"
            for f in features
            if f.get("type") in ("GENDER", "ANIMACY", "ASPECT")
        )
    )


def compare(
    lemma: str,
    pos: str,
    artifact_cells: dict[str, str],
    artifact_inherent: str,
    service: dict,
) -> Comparison:
    """
    Compare one lexeme's artifact paradigm against a service response.

    Forms are matched after normalisation, so a difference in stress marking or in
    `ё` spelling is not reported as a disagreement -- both sides are inconsistent
    about those, and neither inconsistency is what this is looking for.
    """
    result = Comparison(lemma=lemma, pos=pos)

    service_cells = cells_of(
        [
            (inflection.get("features") or [], inflection.get("inflected") or "")
            for inflection in service.get("inflections") or []
        ]
    )

    for key, artifact_form in artifact_cells.items():
        service_form = service_cells.get(key)
        if service_form is None:
            result.artifact_only.append(key)
        elif normalise(artifact_form) == normalise(service_form):
            result.agreed += 1
        else:
            result.disagreed[key] = (artifact_form, service_form)

    result.service_only = [k for k in service_cells if k not in artifact_cells]

    service_inherent = inherent(service.get("lemmaFeatures") or [])
    if artifact_inherent != service_inherent:
        # The distinction `68c61a8` introduced. A noun whose gender the two
        # sources disagree on is worth knowing about even when every cell matches.
        result.lemma_features = (artifact_inherent, service_inherent)

    return result


def sample(
    connection: sqlite3.Connection, pos: str, limit: int
) -> list[tuple[str, str, dict[str, str]]]:
    """Pick the lexemes to compare: those with a paradigm, best-documented first."""
    rows = connection.execute(
        "SELECT l.id, l.lemma, l.lemma_features FROM lexeme l"
        " WHERE l.pos = ? AND EXISTS ("
        "   SELECT 1 FROM form f WHERE f.lexeme_id = l.id AND f.is_cell = 1)"
        " ORDER BY l.sense_count DESC, l.lemma"
        " LIMIT ?",
        (pos, limit),
    ).fetchall()

    out = []
    for row in rows:
        cells = cells_of(
            [
                (json.loads(f["features"]), f["form"])
                for f in connection.execute(
                    "SELECT form, features FROM form"
                    " WHERE lexeme_id = ? AND is_cell = 1 ORDER BY ord",
                    (row["id"],),
                )
            ]
        )
        out.append((row["lemma"], inherent(json.loads(row["lemma_features"])), cells))
    return out


def fetch(base_url: str, api_key: str, language: str, lemma: str, pos: str) -> dict:
    """Ask the deployed inflections service for a paradigm."""
    request = urllib.request.Request(
        f"{base_url.rstrip('/')}/inflections/{language}",
        data=json.dumps({"lemma": lemma, "pos": pos}).encode(),
        headers={"Content-Type": "application/json", "x-api-key": api_key},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT) as response:
        return json.loads(response.read())


def run(
    artifact: Path,
    language: str,
    base_url: str,
    api_key: str,
    limit: int,
    concurrency: int,
    parts_of_speech: tuple[str, ...],
) -> dict[str, list[Comparison]]:
    connection = sqlite3.connect(f"file:{artifact}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row

    results: dict[str, list[Comparison]] = {}
    try:
        for pos in parts_of_speech:
            lexemes = sample(connection, pos, limit)
            logger.info("comparing %d %s lexemes", len(lexemes), pos)

            def one(entry, pos=pos) -> Comparison:
                lemma, artifact_inherent, cells = entry
                try:
                    return compare(
                        lemma, pos, cells, artifact_inherent,
                        fetch(base_url, api_key, language, lemma, pos),
                    )
                except urllib.error.HTTPError as e:
                    # A 400 is the service declining the word -- low confidence or
                    # a POS mismatch. Recorded rather than ignored: a lemma
                    # Wiktionary has and pymorphy3 refuses is exactly the coverage
                    # the dictionary is meant to add.
                    return Comparison(lemma, pos, error=f"HTTP {e.code}")
                except Exception as e:  # noqa: BLE001 - reported, not handled
                    return Comparison(lemma, pos, error=type(e).__name__)

            with ThreadPoolExecutor(max_workers=concurrency) as pool:
                results[pos] = list(pool.map(one, lexemes))
    finally:
        connection.close()

    return results


def report(results: dict[str, list[Comparison]]) -> int:
    """
    Print the report and return the number of disagreeing cells.

    Deliberately not a pass/fail threshold. "Fewer than 2% disagree" is not the
    bar -- the bar is that every *class* of disagreement has been looked at, which
    is why the output groups by coordinate and shows examples rather than just
    counting.
    """
    total_disagreements = 0

    for pos, comparisons in results.items():
        errors = [c for c in comparisons if c.error]
        usable = [c for c in comparisons if not c.error]
        cells = sum(c.compared for c in usable)
        agreed = sum(c.agreed for c in usable)
        disagreed = sum(len(c.disagreed) for c in usable)
        total_disagreements += disagreed

        print(f"\n{'=' * 72}\n{pos}\n{'=' * 72}")
        print(f"  lexemes sampled     {len(comparisons)}")
        print(f"  service declined    {len(errors)}")
        print(f"  cells compared      {cells}")
        if cells:
            print(f"  agreed              {agreed} ({agreed / cells:.1%})")
            print(f"  disagreed           {disagreed} ({disagreed / cells:.1%})")

        by_coordinate: dict[str, list[Comparison]] = defaultdict(list)
        for comparison in usable:
            for key in comparison.disagreed:
                by_coordinate[key].append(comparison)

        if by_coordinate:
            print("\n  disagreements by cell:")
            for key, group in sorted(
                by_coordinate.items(), key=lambda kv: -len(kv[1])
            ):
                print(f"    {key:<40} {len(group)}")
                for comparison in group[:3]:
                    artifact_form, service_form = comparison.disagreed[key]
                    print(
                        f"      {comparison.lemma}: "
                        f"artifact {artifact_form!r} vs service {service_form!r}"
                    )

        missing = Counter(k for c in usable for k in c.artifact_only)
        extra = Counter(k for c in usable for k in c.service_only)
        if missing:
            print("\n  cells the service does not produce:")
            for key, count in missing.most_common(10):
                print(f"    {key:<40} {count}")
        if extra:
            print("\n  cells missing from the artifact:")
            for key, count in extra.most_common(10):
                print(f"    {key:<40} {count}")

        gender = [c for c in usable if c.lemma_features]
        if gender:
            print(f"\n  inherent features differ for {len(gender)} lexemes:")
            for comparison in gender[:10]:
                artifact_features, service_features = comparison.lemma_features
                print(
                    f"    {comparison.lemma}: artifact {artifact_features or '-'} "
                    f"vs service {service_features or '-'}"
                )

        if errors:
            reasons = Counter(c.error for c in errors)
            print("\n  service declined:")
            for reason, count in reasons.most_common():
                print(f"    {reason:<40} {count}")

    print(
        f"\n{total_disagreements} disagreeing cells in total. "
        "Understand each class above before publishing the artifact -- a low rate "
        "is not the bar."
    )
    return total_disagreements


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("artifact", type=Path, help="path to the SQLite artifact")
    parser.add_argument("--language", default="ru")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT)
    parser.add_argument("--concurrency", type=int, default=DEFAULT_CONCURRENCY)
    parser.add_argument(
        "--pos",
        default=",".join(COMPARABLE_POS),
        help="comma-separated parts of speech to compare",
    )
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")

    base_url = os.environ.get("API_GW_URL")
    api_key = os.environ.get("API_GW_API_KEY")
    if not base_url or not api_key:
        parser.error("API_GW_URL and API_GW_API_KEY must be set")

    results = run(
        artifact=args.artifact,
        language=args.language,
        base_url=base_url,
        api_key=api_key,
        limit=args.limit,
        concurrency=args.concurrency,
        parts_of_speech=tuple(p.strip().upper() for p in args.pos.split(",") if p.strip()),
    )
    report(results)
    # Always 0: this is a report to read, not a gate to satisfy automatically.
    return 0


if __name__ == "__main__":
    sys.exit(main())
