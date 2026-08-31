-- Schema of the dictionary artifact.
--
-- The file is built once, offline, from a wiktextract dump and then read
-- read-only by `lambda/dictionary`. Nothing writes to it at runtime, so it
-- carries no autoincrement sequences, no timestamps and no constraints beyond
-- the ones that keep the build honest.

PRAGMA journal_mode = OFF;
PRAGMA synchronous = OFF;

-- Provenance. Required rather than nice-to-have: Wiktionary is CC BY-SA, so the
-- artifact has to be able to say where it came from and under what terms.
CREATE TABLE meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- One row per (headword, part of speech, etymology) triple. Homographs are
-- separate lexemes on purpose: `стать` the noun and `стать` the verb are two
-- entries a learner should be offered a choice between, which is the whole point
-- of moving off the "one word, one answer, else an error" model.
CREATE TABLE lexeme (
    id             INTEGER PRIMARY KEY,
    lemma          TEXT    NOT NULL,  -- plain form, safe for TTS and flashcard fronts
    lemma_accented TEXT,              -- with stress marks, NULL when identical to lemma
    norm           TEXT    NOT NULL,  -- lookup key: casefolded, unstressed, e-normalised
    pos            TEXT    NOT NULL,  -- Universal Dependencies tag
    lemma_features TEXT    NOT NULL,  -- JSON array of {type, value}: inherent features
    etymology_no   INTEGER,           -- wiktextract etymology_number, disambiguates homographs
    sense_count    INTEGER NOT NULL   -- denormalised, used to rank search results
);

CREATE INDEX idx_lexeme_norm ON lexeme (norm);

CREATE TABLE sense (
    lexeme_id INTEGER NOT NULL REFERENCES lexeme (id),
    ord       INTEGER NOT NULL,
    gloss     TEXT    NOT NULL,
    tags      TEXT    NOT NULL  -- JSON array of raw sense tags, e.g. ["colloquial"]
);

CREATE INDEX idx_sense_lexeme ON sense (lexeme_id, ord);

-- Every form wiktextract extracted, whether or not it is a paradigm cell.
--
-- `is_cell` is what the paradigm is assembled from; the rest (participles, short
-- adjectives, imperatives) is kept because it is real lexical data that a richer
-- entry view can use, and because dropping it at build time would mean
-- rebuilding the artifact to get it back.
CREATE TABLE form (
    lexeme_id INTEGER NOT NULL REFERENCES lexeme (id),
    ord       INTEGER NOT NULL,
    form      TEXT    NOT NULL,
    accented  TEXT,
    norm      TEXT    NOT NULL,
    features  TEXT    NOT NULL,  -- JSON array of {type, value}
    raw_tags  TEXT    NOT NULL,  -- JSON array, as it came out of wiktextract
    is_cell   INTEGER NOT NULL
);

CREATE INDEX idx_form_lexeme ON form (lexeme_id, ord);

-- Not read by the pilot, which resolves inflected input through the morphology
-- service instead. It is created anyway because the column has to be stored to
-- build the paradigm at all, so the index is one B-tree rather than a rebuild,
-- and skipping the Lambda hop later becomes a pure code change.
CREATE INDEX idx_form_norm ON form (norm);
