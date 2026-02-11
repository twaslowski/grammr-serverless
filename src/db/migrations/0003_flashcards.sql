-- ============================================================================
-- FLASHCARD TABLE
-- Stores flashcard content (front/back) within decks
-- ============================================================================

CREATE TABLE IF NOT EXISTS "flashcard"
(
    id         SERIAL PRIMARY KEY                                                NOT NULL,
    deck_id    INTEGER REFERENCES deck (id) ON DELETE CASCADE                    NOT NULL,
    front      TEXT                                                              NOT NULL,
    back       JSONB                                                             NOT NULL,
    notes      TEXT,
    version    INTEGER                  DEFAULT 1                                NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE flashcard
    ENABLE ROW LEVEL SECURITY;

-- Deck owners have full access to flashcards in their decks
CREATE POLICY "owned entity access"
    ON flashcard
    FOR ALL
    USING (
    EXISTS (SELECT 1
            FROM deck
            WHERE deck.id = flashcard.deck_id
              AND (SELECT auth.uid()) = deck.user_id)
    );

-- Anyone can read flashcards in public decks
CREATE POLICY "public entity read access"
    ON flashcard
    FOR SELECT
    USING (
    EXISTS (SELECT 1
            FROM deck
            WHERE deck.id = flashcard.deck_id
              AND deck.visibility = 'public')
    );
