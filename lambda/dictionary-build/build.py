"""
Builds the dictionary artifact for one language from a wiktextract dump.

    python build.py ru --out dist/ru.sqlite

The dump is the English edition of Wiktionary as extracted by wiktextract and
published at https://kaikki.org/dictionary/rawdata.html. The English edition is
used rather than the per-language ones because it carries entries for every
target language *with English glosses*, which is what a learner whose source
language is English or German needs.

It is 22.9 GB uncompressed, so it is streamed and filtered on `lang_code` rather
than downloaded: nothing larger than one JSON line is ever held in memory. Pass
``--source`` a local path to work against a file already on disk.

This module is not deployed. It follows `lambda/preprocessing` in living under
`lambda/` as offline data tooling with no Terraform module of its own, and it
depends on nothing outside the standard library.
"""

import argparse
import gzip
import json
import logging
import sqlite3
import sys
import urllib.request
from collections.abc import Iterator
from pathlib import Path

from tag_mapping import MAPPERS, map_pos
from tag_mapping.base import MappedForm, normalise, strip_accents

DUMP_URL = "https://kaikki.org/dictionary/raw-wiktextract-data.jsonl.gz"

SOURCE_NAME = "English Wiktionary via wiktextract (kaikki.org)"
SOURCE_LICENSE = "CC BY-SA 4.0"
SOURCE_LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/"

#: Wiktionary language names keyed by the code grammr uses, needed because
#: `lang_code` in the dump is Wiktionary's own code and not always ISO 639-1.
LANGUAGE_NAMES = {"ru": "Russian"}

#: Preference order when two cells claim the same coordinate. An imperfective verb
#: has both present and (compound) future forms tagged with the same person and
#: number, and the table resolves a cell with `Array.prototype.find`, so whichever
#: row is stored first wins. Present is the form a learner wants; for a perfective
#: verb there is no present, so future wins by default, which is also correct.
TENSE_PREFERENCE = {"PRES": 0, "FUT": 1, "PAST": 2}

#: Glosses beyond this are dropped. Long-tail senses on a word like ``идти`` run
#: into the dozens and are overwhelmingly archaic or highly idiomatic; keeping all
#: of them makes the artifact bigger and the entry unreadable.
MAX_SENSES = 12

logger = logging.getLogger("build")


def iter_dump(source: str, language_name: str) -> Iterator[dict]:
    """
    Yield the dump's entries for one language.

    Both a URL and a local path are accepted, and gzip is detected from the
    suffix rather than sniffed, because the published artifacts are consistently
    named and guessing would only hide a mistyped path.
    """
    if source.startswith(("http://", "https://")):
        raw = urllib.request.urlopen(source)  # noqa: S310 - fixed, documented host
    else:
        raw = open(source, "rb")

    with raw:
        stream = gzip.GzipFile(fileobj=raw) if source.endswith(".gz") else raw
        for line in stream:
            if not line.strip():
                continue
            entry = json.loads(line)
            if entry.get("lang") == language_name:
                yield entry


def senses_of(entry: dict) -> list[tuple[str, list[str]]]:
    """
    Flatten an entry's senses into (gloss, tags) pairs.

    Senses that carry no gloss are skipped rather than kept as empty strings:
    wiktextract emits them for form-of stubs and inflection placeholders, which
    would otherwise show up in the UI as blank numbered lines.
    """
    out: list[tuple[str, list[str]]] = []
    for sense in entry.get("senses") or []:
        glosses = sense.get("glosses") or []
        tags = [t for t in (sense.get("tags") or []) if isinstance(t, str)]
        for gloss in glosses:
            if isinstance(gloss, str) and gloss.strip():
                out.append((gloss.strip(), tags))
        if len(out) >= MAX_SENSES:
            break
    return out[:MAX_SENSES]


def canonical_lemma(entry: dict) -> tuple[str, str | None]:
    """
    Pick the headword to display, returning (plain, accented or None).

    The plain form is authoritative and is always the unstressed spelling: it is
    what goes into a flashcard front, what Polly is asked to pronounce, and what
    a learner types. The stressed spelling is carried alongside it for display
    only.

    Stress can arrive from either direction. Usually ``word`` is the page title
    and unstressed, with the accented spelling in a form tagged ``canonical``;
    but some entries put stress straight into ``word``. Both are handled by
    stripping unconditionally and then looking for an accented variant, rather
    than trusting ``word`` to be plain. A canonical row that disagrees once
    stress is stripped is describing something else -- a multi-word citation
    form, say -- and is ignored.
    """
    word = (entry.get("word") or "").strip()
    plain = strip_accents(word)
    if not plain:
        return "", None

    for raw in entry.get("forms") or []:
        if "canonical" not in (raw.get("tags") or []):
            continue
        candidate = (raw.get("form") or "").strip()
        if candidate and strip_accents(candidate) == plain:
            return plain, candidate if candidate != plain else None

    return plain, word if word != plain else None


def sort_cells(forms: list[MappedForm]) -> list[MappedForm]:
    """
    Order forms so the preferred cell wins a coordinate collision.

    Cells come before non-cells, and among cells the tense preference decides.
    The sort is stable, so forms that tie keep the order the dump gave them.
    """

    def key(form: MappedForm) -> tuple[int, int]:
        tense = next((f.value for f in form.features if f.type == "TENSE"), None)
        return (0 if form.is_cell else 1, TENSE_PREFERENCE.get(tense, 3))

    return sorted(forms, key=key)


def build(source: str, language: str, out: Path) -> dict[str, int]:
    """
    Write the artifact for one language and return counts for the build log.

    The database is created fresh every time; an existing file at ``out`` is
    replaced. Inserts run in a single transaction and the indexes are created
    from `schema.sql` up front -- the dump is large but the per-language slice is
    small enough that deferring index creation buys little and complicates the
    failure path.
    """
    mapper_cls = MAPPERS.get(language)
    if mapper_cls is None:
        raise ValueError(f"No tag mapping for language {language!r}")
    mapper = mapper_cls()

    language_name = LANGUAGE_NAMES.get(language)
    if language_name is None:
        raise ValueError(f"No Wiktionary language name known for {language!r}")

    out.parent.mkdir(parents=True, exist_ok=True)
    out.unlink(missing_ok=True)

    schema = (Path(__file__).parent / "schema.sql").read_text()
    connection = sqlite3.connect(out)
    counts = {"entries": 0, "lexemes": 0, "senses": 0, "forms": 0, "cells": 0}

    try:
        connection.executescript(schema)
        connection.execute(
            "INSERT INTO meta (key, value) VALUES (?, ?)",
            ("language", language),
        )
        for key, value in (
            ("source", SOURCE_NAME),
            ("source_url", DUMP_URL if source.startswith("http") else source),
            ("license", SOURCE_LICENSE),
            ("license_url", SOURCE_LICENSE_URL),
            ("schema_version", "1"),
        ):
            connection.execute(
                "INSERT INTO meta (key, value) VALUES (?, ?)", (key, value)
            )

        lexeme_id = 0
        for entry in iter_dump(source, language_name):
            counts["entries"] += 1
            if counts["entries"] % 50_000 == 0:
                logger.info("read %d entries, kept %d", counts["entries"], counts["lexemes"])

            senses = senses_of(entry)
            if not senses:
                # No gloss means nothing to define, which is the one thing every
                # dictionary entry has to have. Inflection-only stubs are reached
                # through their lemma instead.
                continue

            pos = map_pos(entry.get("pos"))
            lemma, accented = canonical_lemma(entry)
            if not lemma:
                continue

            lexeme_id += 1
            counts["lexemes"] += 1
            head_tags = [t for t in (entry.get("tags") or []) if isinstance(t, str)]
            features = mapper.lemma_features(pos, head_tags)

            connection.execute(
                "INSERT INTO lexeme (id, lemma, lemma_accented, norm, pos,"
                " lemma_features, etymology_no, sense_count)"
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    lexeme_id,
                    lemma,
                    accented,
                    normalise(lemma),
                    pos,
                    json.dumps([f.json() for f in features], ensure_ascii=False),
                    entry.get("etymology_number"),
                    len(senses),
                ),
            )

            connection.executemany(
                "INSERT INTO sense (lexeme_id, ord, gloss, tags) VALUES (?, ?, ?, ?)",
                [
                    (lexeme_id, ord_, gloss, json.dumps(tags, ensure_ascii=False))
                    for ord_, (gloss, tags) in enumerate(senses)
                ],
            )
            counts["senses"] += len(senses)

            mapped = [
                form
                for form in (mapper.map_form(raw) for raw in entry.get("forms") or [])
                if form is not None
            ]
            # The canonical row is the headword itself, already stored on the
            # lexeme; keeping it would add a stress-marked duplicate of the lemma
            # to the form list.
            mapped = [f for f in mapped if "canonical" not in f.raw_tags]

            rows = sort_cells(mapped)
            connection.executemany(
                "INSERT INTO form (lexeme_id, ord, form, accented, norm, features,"
                " raw_tags, is_cell) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    (
                        lexeme_id,
                        ord_,
                        form.form,
                        form.accented,
                        form.norm,
                        json.dumps([f.json() for f in form.features], ensure_ascii=False),
                        json.dumps(form.raw_tags, ensure_ascii=False),
                        int(form.is_cell),
                    )
                    for ord_, form in enumerate(rows)
                ],
            )
            counts["forms"] += len(rows)
            counts["cells"] += sum(1 for f in rows if f.is_cell)

        connection.commit()
        connection.execute("ANALYZE")
        connection.commit()
    finally:
        connection.close()

    # VACUUM has to run outside the transaction that filled the file, and on its
    # own connection, or SQLite refuses.
    with sqlite3.connect(out) as vacuum_connection:
        vacuum_connection.execute("VACUUM")

    return counts


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("language", choices=sorted(MAPPERS), help="target language code")
    parser.add_argument(
        "--source",
        default=DUMP_URL,
        help="dump URL or local path (default: the published kaikki.org dump)",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="output path (default: dist/<language>.sqlite)",
    )
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    out = args.out or Path("dist") / f"{args.language}.sqlite"

    counts = build(args.source, args.language, out)
    size_mb = out.stat().st_size / 1024 / 1024
    logger.info(
        "wrote %s (%.1f MB): %d lexemes, %d senses, %d forms of which %d cells,"
        " from %d entries",
        out,
        size_mb,
        counts["lexemes"],
        counts["senses"],
        counts["forms"],
        counts["cells"],
        counts["entries"],
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
