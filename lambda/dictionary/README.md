# dictionary

Dictionary lookup: senses, part of speech, inherent features and — when the word
has one — an inflection table.

This is the service the inflection generator should have been. `/inflections/ru`
needs a lemma *and* a part of speech and answers with a paradigm or an error, so
it can only speak about the four parts of speech that inflect and only to callers
who already know what they are asking. This one answers for any word, and says
"real word, no paradigm" where the old endpoint had to say "error".

## Contract

`POST /dictionary/{language}` — see `openapi.yaml`.

```jsonc
// request
{ "query": "стол", "pos": "NOUN" }   // pos is optional, and only narrows homographs

// response
{
  "query": "стол",
  "entries": [{
    "lemma": "стол",
    "accented": "сто́л",
    "partOfSpeech": "NOUN",
    "lemmaFeatures": [{ "type": "GENDER", "value": "MASC" }, { "type": "ANIMACY", "value": "INAN" }],
    "senses": [{ "gloss": "table (piece of furniture)", "tags": [] }],
    "inflections": [{ "lemma": "стол", "inflected": "стола", "accented": "стола́",
                      "features": [{ "type": "CASE", "value": "GEN" },
                                   { "type": "NUMBER", "value": "SING" }] }]
  }],
  "attribution": { "source": "…", "license": "CC BY-SA 4.0", "licenseUrl": "…" }
}
```

Three answers, three shapes, all of them 200s:

| Case | Shape |
|---|---|
| Known, inflects | `entries[0].inflections` is a list |
| Known, does not inflect | `entries[0].inflections` is **`null`** |
| Unknown | `entries` is `[]` |

`null` and `[]` on `inflections` are not interchangeable. A `null` says the word
has no paradigm by nature — an adverb, a preposition, an indeclinable noun like
`кофе`; an empty list would be indistinguishable from a table that failed to
extract.

The endpoint matches **headwords only**. Resolving `шёл` to `идти` is the BFF's
job, via the morphology service, which keeps lemmatisation in the one place that
already does it.

## Data

A SQLite file per language, built offline by
[`lambda/dictionary-build`](../dictionary-build) from a
[wiktextract](https://github.com/tatuylonen/wiktextract) dump and published to
`s3://${AWS_ACCOUNT_ID}-eu-central-1-grammr/dictionary/<language>.sqlite`.

Content is **CC BY-SA 4.0** (Wiktionary). The artifact records its own provenance
in a `meta` table and every response carries an `attribution` object, because the
licence obliges attribution and the obligation should not depend on a UI
remembering to add it.

### Why the file is downloaded rather than range-read

`store.py` fetches the artifact into `/tmp` once per cold start and serves every
query from local disk. A range-request VFS (`apsw`, `sqlite3vfshttp`) would skip
the download but turns each query into several round trips to S3, and adds a
dependency to a function whose *lack* of dependencies is why its artifact is a
few kilobytes — which matters, because the zip Lambdas already run close to the
50 MB direct-upload limit (see `lambda_source_excludes` in
`terraform/application/locals.tf`).

Cold starts are already managed: the warm-up path primes the artifact rather than
returning early, so the request that pays for the download is the pre-flight ping
rather than a user's first lookup. Revisit this if a language's file outgrows the
configured `ephemeral_storage`.

## Environment

| Variable | Purpose |
|---|---|
| `DICTIONARY_BUCKET` | S3 bucket holding the artifacts. Required in deployment. |
| `DICTIONARY_PREFIX` | Key prefix, default `dictionary`. |
| `DICTIONARY_CACHE_DIR` | Where to cache the artifact, default `/tmp`. Point it at a staged file to run without S3. |

## Local

```sh
uv run --frozen pytest
```

Tests build the artifact from the builder's committed fixture and point
`DICTIONARY_CACHE_DIR` at it, so they need neither S3 nor boto3. That is on
purpose: asserting against a hand-written SQLite file would let the reader and
the builder drift apart, and what is worth testing is that what the builder
writes is what this can serve.

To exercise it through the runtime interface emulator, stage an artifact and
mount it, following the pattern in `lambda/inflections-ru/README.md`:

```sh
cd ../dictionary-build && uv run python build.py ru --source fixtures/ru-sample.jsonl --out /tmp/artifacts/ru.sqlite
```
