-- Create deck_study table with proper constraints and metadata
CREATE TABLE deck_study
(
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id         INT REFERENCES deck (id) ON DELETE CASCADE,
    user_id         UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    last_studied_at TIMESTAMP,
    is_active       BOOLEAN          DEFAULT TRUE,
    created_at      TIMESTAMP        DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at      TIMESTAMP        DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE (deck_id, user_id)
);

-- Enable RLS
ALTER TABLE deck_study
    ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own deck studies"
    ON deck_study
    FOR ALL
    USING ((select auth.uid()) = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_deck_study_updated_at
    BEFORE UPDATE
    ON deck_study
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add deck_id to card table for denormalization (as described in fsrs.md)
ALTER TABLE card
    ADD COLUMN deck_id INT;

-- Populate deck_id for all existing cards
UPDATE card
SET deck_id = (SELECT f.deck_id
               FROM flashcard f
               WHERE f.id = card.flashcard_id);

-- Before the UPDATE, check for orphaned cards:
DELETE
FROM card
WHERE flashcard_id NOT IN (SELECT id FROM flashcard);

-- Make deck_id NOT NULL after populating
ALTER TABLE card
    ALTER COLUMN deck_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE card
    ADD CONSTRAINT fk_card_deck_id
        FOREIGN KEY (deck_id) REFERENCES deck (id) ON DELETE CASCADE;

-- Create index for efficient queries
CREATE INDEX idx_card_deck_id ON card (deck_id);

-- Insert rows into deck_study for each existing deck (each deck owner studies their own deck)
INSERT INTO deck_study (deck_id, user_id)
SELECT d.id, d.user_id
FROM deck d
WHERE NOT EXISTS (SELECT 1
                  FROM deck_study ds
                  WHERE ds.deck_id = d.id
                    AND ds.user_id = d.user_id);

-- Update RLS policies for deck
DROP POLICY IF EXISTS "Users can view their own decks" ON deck;
CREATE POLICY "Users can view their own decks"
    ON deck
    FOR SELECT
    USING ((select auth.uid()) = user_id OR visibility = 'public');

CREATE POLICY "Users can view decks they study"
    ON deck
    FOR SELECT
    USING (
    (SELECT auth.uid()) = user_id
        OR visibility = 'public'
        OR EXISTS (SELECT 1
                   FROM deck_study
                   WHERE deck_study.deck_id = deck.id
                     AND deck_study.user_id = (SELECT auth.uid()))
    );