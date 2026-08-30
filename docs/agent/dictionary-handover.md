# Dictionary feature — handover

Read this before touching `lambda/dictionary*`, `../../src/lib/dictionary-lookup.ts` or
`../../src/components/dictionary`.

> **First: check `git status`.** A concurrent session repeatedly reverted every
> modified tracked file during this work — all of `terraform/*`, `../../src/types/languages.ts`,
> `../../src/db/schemas/schema.ts`, `../../src/app/api/v1/pre-flight/route.ts`,
> `../../src/components/dashboard/dashboard-nav.tsx`, `../../src/components/translation/word-details-dialog.tsx`,
> `../../src/app/dashboard/inflect/page.tsx`, the three `../../e2e` files, `../../.github/workflows/ci.yml`,
> `../../README.md` — and deleted this file once. Everything was re-applied and
> re-verified, but nothing is committed. **Commit before doing anything else.**

---

## 1. Running it locally, without deploying

`callApiGateway` sends every NLP request to `API_GW_URL`, so without a local
option you have to deploy the Lambda before you can see the dictionary at all.
`../../lambda/dictionary/local_server.py` closes that gap.

```sh
task start-env          # local Supabase
pnpm db:migrate         # creates lexeme_cache
task dictionary:serve   # builds the fixture artifact, serves it on :9010
```

Then in `../../.env.local`:

```
API_GW_URL=http://127.0.0.1:9010
DICTIONARY_UPSTREAM_URL=<the real API Gateway URL>
DICTIONARY_UPSTREAM_API_KEY=<the real API Gateway key>
```

and `pnpm dev`.

The shim speaks the API Gateway v2 proxy protocol, invokes the handler
in-process, and **forwards any path it does not own** to
`DICTIONARY_UPSTREAM_URL`. That forwarding is the point rather than a nicety: the
dictionary's fallback chain calls the deployed morphology service to resolve
inflected input, so a shim that only 404'd other paths would be a worse trade
than deploying. Omit the two `DICTIONARY_UPSTREAM_*` variables to work fully
offline — other services then answer 502 with an explanation, and headword
lookups still work.

`local_server.py` is dev-only and excluded from packaging
(`lambda_source_excludes` in `../../terraform/application/locals.tf`).

### The fixture artifact

`task dictionary:serve` builds from
`../../lambda/dictionary-build/fixtures/ru-sample.jsonl`, not the 22.9 GB dump. Seven
lexemes, chosen to cover every shape the UI renders:

| Word | Exercises |
|---|---|
| `стол` | noun, full 12-cell table, inherent gender + animacy, stressed headword |
| `новый` | adjective — gender is *inflectional*, so the 24-cell layout |
| `идти` | verb, and the present/future cell collision |
| `быстро` | adverb: senses, `inflections: null` |
| `кофе` | indeclinable noun — a different message from "no table" |
| `стать` | homograph offered as a choice (noun + verb) |
| `xyz123` | unknown: 200 with `entries: []` |

The e2e dictionary words in `../../e2e/test-data.ts` were deliberately aligned to these,
so `../../e2e/tests/dictionary.spec.ts` runs against either a local fixture artifact or
a published one.

**Verified end to end** through the running Next app against the shim: `стол` →
12 cells; `быстро` → `inflections: null`; `стать` → two entries; `xyz123` → 200
with no entries. `lexeme_cache` is optional — without the migration the lookup
still works and just logs a warning per request, which is the designed
degradation.

---

## 2. Deploying

Two independent steps, deliberately uncoupled: the artifact changes on a
Wiktionary refresh, the function when its code does, and coupling them would mean
every `tofu apply` re-uploading hundreds of megabytes.

```sh
task apply:dev                  # the Lambda, route, IAM, bucket policy
task dictionary:publish:ru      # build → verify prompt → upload the artifact
```

`../../lambda/dictionary-build/publish.sh` reports the artifact size (check it against
`local.dictionary.ephemeral_storage_mb`), reminds you to run `verify.py`, and
asks before uploading. Warm containers keep the copy already in `/tmp`, so a
refreshed artifact reaches readers as they age out; redeploy to force it sooner.

`tofu fmt` and `tofu validate` both pass — use `TENV_AUTO_INSTALL=true`, which is
how tofu resolves in this repo. `tofu plan` has **not** been run: it needs live
credentials and the session had expired.

Terraform pieces:
- `../../terraform/shared/s3.tf` — bucket policy extended to `dictionary/*`.
- `../../terraform/application/data.tf` — `data.aws_s3_bucket.artifacts` lookup.
- `../../terraform/application/locals.tf` — `local.dictionary` (languages, ephemeral
  storage), plus `conftest.py` and `local_server.py` added to the packaging
  excludes.
- `../../terraform/application/lambda.tf` — `module.dictionary_lambda`: zip,
  `python3.14`, 1024 MB, 1 GB ephemeral, `s3:GetObject` scoped to
  `dictionary/*`.
- `../../terraform/application/api-gateway.tf` — `POST /dictionary/{lang}` **with the
  `token` authorizer**, unlike the pre-existing unauthenticated `/inflections/*`
  and `/morphology/*`.

---

## 3. Why the artifact is SQLite and not Parquet

Raised as "wouldn't Parquet in S3 be easier?". Analysed and rejected; recorded so
it does not get re-litigated.

**Parquet is built for scans, SQLite for point lookups.** A dictionary lookup is
the most point-lookup-shaped query there is. Parquet has no index — row-group
min/max stats only help if sorted on `norm`, Bloom filters only *reject* groups,
and page-level ColumnIndex narrows to ~1 MB. Best case is ~1 MB decompressed plus
several structural reads. SQLite's B-tree does it in three or four 4 KB pages.
That is a difference in what the format is for, not a tuning gap.

**The dependency cost is disqualifying.** `sqlite3` is stdlib, which is why this
function packages to **37 KB with zero dependencies** (verified). `pyarrow` is
~120 MB installed. `../../terraform/application/locals.tf` already carries a comment
about the translate artifact having been pushed past the **50 MB direct-upload
limit**, and there is no Lambda layer or S3-staged deploy in this repo — so
Parquet forces a container image: ECR repo, `build.sh`, version vars in two
tfvars files, and inclusion in the twice-daily image-refresher cold-start cycle.

**The comparison isn't even remote-vs-local.** `store.py` already downloads the
artifact to `/tmp` once per cold start, so Parquet saves no transfer. It only
changes what happens after, where SQLite wins outright.

**Relational shape.** An entry is a join: `lexeme` → `sense` (1:n, ordered) →
`form` (1:n, ordered, `is_cell` predicate). Parquet needs three files aligned by
hand or nested columns every reader must understand.

**When it would change:** if the artifact outgrows ephemeral storage (`/tmp` maxes
at 10 GB; provisioned at 1 GB), the move is to change the **transport, not the
format** — a SQLite range-read VFS (`apsw`, `sqlite3vfshttp`), already flagged in
`store.py`'s docstring as the escape hatch. DuckDB-over-Parquet is the
alternative and has the same packaging problem. Parquet *is* right for offline
analytics in `../../lambda/dictionary-build`; just not for what the Lambda reads.
S3 Select is not an option — AWS has been winding it down.

---

## 4. What is built and verified

All green: `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`
(226 tests / 18 suites), `../../lambda/dictionary` pytest (65),
`../../lambda/dictionary-build` pytest (79), `tofu fmt`, `tofu validate`.

### Offline builder — `../../lambda/dictionary-build` (not deployed)

Zero runtime deps; follows the `../../lambda/preprocessing` precedent.

- `build.py` — streams the kaikki.org dump, filters by language, writes SQLite.
- `schema.sql` — `meta`, `lexeme`, `sense`, `form`.
- `tag_mapping/{base,ru}.py` — **the fiddly part.** Wiktionary tags → grammr
  `Feature`s. The values are matched verbatim by `InflectionsTable`, so they are
  not free choices; note grammr calls the instrumental `ABL` and the
  prepositional `LOC`.
- `verify.py` — the confidence gate (see §5.3).
- `publish.sh` — build + verify prompt + upload.

### Lambda — `../../lambda/dictionary`

Zip, `python3.14`, stdlib only, 37 KB.

- `POST /dictionary/{language}` — see `openapi.yaml`.
- Three answers, all 200: `inflections` is a list / `inflections` is **`null`**
  (does not inflect) / `entries` is `[]` (unknown). **`null` and `[]` are not
  interchangeable** — that distinction is the feature.
- Keep-warm **primes the artifact** rather than returning early, so the
  pre-flight ping pays for the download, not a reader's first lookup.
- Does not copy `inflections-ru`'s broken
  `except ValidationError | json.JSONDecoder`; malformed bodies are a real 400
  here, with a test.

### App

- `../../src/db/schemas/lexemeCache.ts` + migration `20260826064946_spooky_green_goblin`
  — write-through cache for generator fallbacks. `lemma_norm` is a stored column,
  not a functional index, because Drizzle can only name plain columns as an
  upsert conflict target.
- `../../src/lib/dictionary-lookup.ts` — cache → artifact → lemmatise via morphology
  and retry → generators, caching the result. Every step may fail without
  failing the lookup.
- `../../src/types/dictionary.ts`, `../../src/lib/dictionary.ts`,
  `../../src/app/api/v1/dictionary/route.ts`, pre-flight warm-up.
- `../../src/components/dictionary` — one debounced input, **no POS picker, no submit
  button**. `InflectionsTable` reused unchanged; `toParadigm` is a projection.
- `/dashboard/dictionary`; `/dashboard/inflect` redirects there when the language
  has `dictionaryEnabled`, and still renders the old form for the Romance
  languages. Nav split accordingly.
- `word-details-dialog.tsx` — a "Definitions" section from the dictionary,
  alongside (not replacing) the contextual LLM translation.

---

## 5. Remaining work, in priority order

1. **Commit.** See the warning at the top.
2. **Tests for `../../src/lib/dictionary-lookup.ts`** — the real gap; I was part-way in
   when the session ended. Most branch-heavy file in the change, no direct
   coverage. Worth asserting: the four-step order; that a cache hit
   short-circuits; that a failing cache read degrades rather than errors; that
   `pos: "X"` is treated as absent; that the final generator fallback is skipped
   when a *different* lemma was resolved (otherwise a paradigm built from an
   inflected form is returned without `resolvedFrom`, i.e. presented as though
   the reader had typed the dictionary form); that a generated entry is cached
   under the service's lemma, not the query.
3. **Build a real Russian artifact and run `verify.py` against it.** Nothing has
   run against the actual dump — only the fixture. Expect the tag mapper to need
   work on tags the fixture lacks. Work through every disagreement class before
   publishing; a low rate is not the bar. Set
   `local.dictionary.ephemeral_storage_mb` from the measured size.
4. **`tofu plan`**, then `task apply:dev`, then walk `/dashboard/dictionary`.
5. **`form.norm` is already indexed** (`idx_form_norm`). Reading it would skip the
   morphology hop for forms Wiktionary knows — pure code change, no rebuild. Keep
   morphology as the fallback for forms it lacks.
6. **A frequency list.** Result ranking uses POS rank then `sense_count`, and
   `verify.py` samples by `sense_count` as a frequency proxy. Weak, and both
   places say so. OpenSubtitles / `wordfreq` fixes both.
7. **German next**, then the Romance languages. 631k German senses *with* tables,
   for a language with no inflection support at all today — the largest
   capability gain available. Per language: a `tag_mapping/<code>.py`, fixtures +
   mirrored tests, an entry in `local.dictionary.languages`, and
   `dictionaryEnabled` in `../../src/types/languages.ts`.

### Known loose ends

- The generated migration contains two no-op `ALTER POLICY` statements —
  whitespace-only reformats picked up from the concurrent session, not from this
  change. Left as `drizzle-kit` generated them to avoid snapshot drift.
- That session also refactored `../../src/lib/inflections.ts` (added `paradigmLayout`)
  and moved `getFeatureDisplayValue`/`getOrderedFeatures` into
  `../../src/lib/feature-labels.ts`. This work is built against the post-refactor API.
- `../../lambda/inflections-ru/inflections/lambda_handler.py` still has the
  `except ValidationError | json.JSONDecoder` bug (a `types.UnionType` that
  `except` rejects, a decoder class that is not an exception, a `pydantic.v1`
  import against v2 models) — malformed bodies 500 instead of 400. Out of scope.
- `../../lambda/inflections-ru/openapi.yaml` is stale.
- Artifact refresh is manual on purpose: a scheduled rebuild would put an
  unreviewed dataset change into production, and step 3 should stay human.

---

## 6. Licence obligation — do not drop this

Wiktionary content is **CC BY-SA 4.0** (dual-licensed with the GFDL). Commercial
use is fine; the obligations are attribution and ShareAlike, and they attach to
the derived dataset, not to grammr's GPL-3.0 code.

Enforced in three places so no single omission breaks it: the artifact's `meta`
table, the `attribution` object on every API response, and a per-entry link in
`dictionary-entry.tsx` rendered from the entry's own `source` (so a result list
mixing Wiktionary and generated entries attributes only what needs it). Jest and
Playwright both cover the UI half. See the "Data" subsection of `../../README.md`.
