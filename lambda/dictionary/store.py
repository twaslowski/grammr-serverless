"""
Read access to the dictionary artifact.

The artifact is a SQLite file built offline by `lambda/dictionary-build` and
published to S3. It is fetched into `/tmp` once per cold start and every query
after that is served from local disk.

That is the whole design, and it is deliberately duller than the alternative. A
range-request VFS (`apsw`, `sqlite3vfshttp`) would avoid the download, but it
turns each query into several round trips to S3 and adds a dependency to a
function whose lack of dependencies is the reason its artifact is measured in
kilobytes. Cold-start cost is already a managed concern here: `check_keep_warm`
and `src/lib/preflight.ts` exist for exactly this, and the download happens on
the same warm-up request that already pays for initialisation. If a language's
file ever outgrows the configured ephemeral storage, that is the point to
reconsider -- not before.

Why SQLite rather than a columnar format in S3 is written up in
`docs/dictionary-handover.md`. The short version: Parquet has no index, so a
point lookup means decompressing a whole row group or data page, and reading it
needs pyarrow -- which would put this function over the zip limit the repo has
already fought once.
"""

import json
import logging
import os
import sqlite3
import threading

from data import MAX_RESULTS, pos_rank

logger = logging.getLogger("root")

BUCKET_ENV = "DICTIONARY_BUCKET"
PREFIX_ENV = "DICTIONARY_PREFIX"
DEFAULT_PREFIX = "dictionary"

#: Where a fetched artifact is cached. `/tmp` is the only writable path in a
#: Lambda execution environment, and it survives for the life of the container,
#: which is what makes the download a per-cold-start rather than per-request cost.
CACHE_DIR = os.environ.get("DICTIONARY_CACHE_DIR", "/tmp")

_connections: dict[str, sqlite3.Connection] = {}
_lock = threading.Lock()


class ArtifactUnavailable(RuntimeError):
    """The artifact for a language could not be opened."""


def _artifact_path(language: str) -> str:
    return os.path.join(CACHE_DIR, f"{language}.sqlite")


def _download(language: str, destination: str) -> None:
    """
    Fetch the artifact from S3.

    boto3 is imported here rather than at module scope so that tests and local
    runs which point `DICTIONARY_CACHE_DIR` at a pre-staged file never need it --
    it is provided by the Lambda runtime but is deliberately not a project
    dependency (see the note in `pyproject.toml`).
    """
    bucket = os.environ.get(BUCKET_ENV)
    if not bucket:
        raise ArtifactUnavailable(
            f"{BUCKET_ENV} is not set and no artifact is staged at {destination}"
        )

    import boto3

    key = f"{os.environ.get(PREFIX_ENV, DEFAULT_PREFIX)}/{language}.sqlite"
    logger.info(json.dumps({"event": "artifact_download", "bucket": bucket, "key": key}))

    # Download to a sibling path and rename, so a container that dies mid-fetch
    # cannot leave a truncated file that the next invocation would happily open.
    staging = f"{destination}.partial"
    boto3.client("s3").download_file(bucket, key, staging)
    os.replace(staging, destination)


def connect(language: str) -> sqlite3.Connection:
    """
    Return a connection to the artifact, fetching it if this is a cold start.

    Connections are cached per language and shared across invocations. The lock
    only guards the fetch: two concurrent requests in the same container must not
    both download, but SQLite reads themselves need no coordination here because
    the file never changes under us.
    """
    connection = _connections.get(language)
    if connection is not None:
        return connection

    with _lock:
        connection = _connections.get(language)
        if connection is not None:
            return connection

        path = _artifact_path(language)
        if not os.path.exists(path):
            _download(language, path)

        try:
            # Read-only, and immutable: nothing writes to this file, so SQLite can
            # skip locking and change detection entirely.
            connection = sqlite3.connect(
                f"file:{path}?immutable=1", uri=True, check_same_thread=False
            )
        except sqlite3.Error as e:
            raise ArtifactUnavailable(f"Could not open {path}: {e}") from e

        connection.row_factory = sqlite3.Row
        _connections[language] = connection
        return connection


def reset() -> None:
    """Drop cached connections. Used by tests; never called in the Lambda."""
    with _lock:
        for connection in _connections.values():
            connection.close()
        _connections.clear()


def metadata(language: str) -> dict[str, str]:
    """Provenance for the artifact, so a response can carry its own attribution."""
    connection = connect(language)
    return {
        row["key"]: row["value"]
        for row in connection.execute("SELECT key, value FROM meta")
    }


def lookup(language: str, norm: str, pos: str | None = None) -> list[dict]:
    """
    Find the lexemes matching a normalised query.

    Results are ordered so the entry a learner most likely meant comes first:
    content words before function words and affixes, then better-documented
    lexemes before thinner ones. Ordering happens in Python rather than SQL
    because the part-of-speech ranking is a product decision that belongs next to
    the rest of the contract in `data.py`, not buried in a CASE expression.
    """
    connection = connect(language)

    sql = (
        "SELECT id, lemma, lemma_accented, pos, lemma_features, etymology_no,"
        " sense_count FROM lexeme WHERE norm = ?"
    )
    parameters: list[object] = [norm]
    if pos is not None:
        sql += " AND pos = ?"
        parameters.append(pos)

    rows = connection.execute(sql, parameters).fetchall()
    rows = sorted(
        rows,
        key=lambda r: (pos_rank(r["pos"]), -r["sense_count"], r["etymology_no"] or 0),
    )
    return [_entry(connection, row) for row in rows[:MAX_RESULTS]]


def _entry(connection: sqlite3.Connection, row: sqlite3.Row) -> dict:
    """
    Assemble one entry.

    ``inflections`` is tri-state on purpose, and the distinction is the point of
    the whole feature: a list means "here is the paradigm", and ``None`` means
    "this word does not inflect" -- an adverb, a preposition, an indeclinable
    noun. Neither is an error, which is what the old form had to report for
    everything that was not a four-POS paradigm.
    """
    lexeme_id = row["id"]

    senses = [
        {"gloss": sense["gloss"], "tags": json.loads(sense["tags"])}
        for sense in connection.execute(
            "SELECT gloss, tags FROM sense WHERE lexeme_id = ? ORDER BY ord",
            (lexeme_id,),
        )
    ]

    cells = connection.execute(
        "SELECT form, accented, features FROM form"
        " WHERE lexeme_id = ? AND is_cell = 1 ORDER BY ord",
        (lexeme_id,),
    ).fetchall()

    inflections = (
        [
            {
                "lemma": row["lemma"],
                "inflected": cell["form"],
                "accented": cell["accented"],
                "features": json.loads(cell["features"]),
            }
            for cell in cells
        ]
        if cells
        else None
    )

    return {
        "lemma": row["lemma"],
        "accented": row["lemma_accented"],
        "partOfSpeech": row["pos"],
        "lemmaFeatures": json.loads(row["lemma_features"]),
        "senses": senses,
        "inflections": inflections,
    }
