-- FSRS (Free Spaced Repetition Scheduler) Tables
-- Migrates from the old flashcard_progress table to ts-fsrs compatible tables

-- 1. Create card_state enum
CREATE TYPE card_state AS ENUM ('New', 'Learning', 'Review', 'Relearning');

-- 2. Create rating enum
CREATE TYPE rating AS ENUM ('Again', 'Hard', 'Good', 'Easy');

-- 3. Create card table (FSRS card state for each flashcard)
CREATE TABLE card
(
    id             SERIAL PRIMARY KEY,
    flashcard_id   INT REFERENCES flashcard (id) ON DELETE CASCADE NOT NULL,
    user_id        UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,

    -- FSRS fields
    due            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    stability      FLOAT NOT NULL DEFAULT 0,
    difficulty     FLOAT NOT NULL DEFAULT 0,
    elapsed_days   INT NOT NULL DEFAULT 0,
    scheduled_days INT NOT NULL DEFAULT 0,
    learning_steps INT NOT NULL DEFAULT 0,
    reps           INT NOT NULL DEFAULT 0,
    lapses         INT NOT NULL DEFAULT 0,
    state          card_state NOT NULL DEFAULT 'New',
    last_review    TIMESTAMP,

    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE (flashcard_id, user_id)
);

-- 4. Create review_log table
CREATE TABLE review_log
(
    id                SERIAL PRIMARY KEY,
    card_id           INT REFERENCES card (id) ON DELETE CASCADE NOT NULL,

    -- FSRS review log fields
    rating            rating NOT NULL,
    state             card_state NOT NULL,
    due               TIMESTAMP NOT NULL,
    stability         FLOAT NOT NULL,
    difficulty        FLOAT NOT NULL,
    elapsed_days      INT NOT NULL,
    last_elapsed_days INT NOT NULL,
    scheduled_days    INT NOT NULL,
    learning_steps    INT NOT NULL,
    review            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Create index for due cards query (most common query pattern)
CREATE INDEX idx_card_due ON card (user_id, due) WHERE state != 'New';
CREATE INDEX idx_card_user_state ON card (user_id, state);
CREATE INDEX idx_review_log_card_id ON review_log (card_id);

-- 6. RLS Policies for card
ALTER TABLE card ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cards"
    ON card
    FOR SELECT
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create their own cards"
    ON card
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
    ON card
    FOR UPDATE
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own cards"
    ON card
    FOR DELETE
    USING ((select auth.uid()) = user_id);

-- 7. RLS Policies for review_log (inherit through card ownership)
ALTER TABLE review_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own review logs"
    ON review_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM card
            WHERE card.id = review_log.card_id
            AND card.user_id = (select auth.uid())
        )
    );

CREATE POLICY "Users can create their own review logs"
    ON review_log
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM card
            WHERE card.id = review_log.card_id
            AND card.user_id = (select auth.uid())
        )
    );

-- 8. Apply updated_at trigger to card table
CREATE TRIGGER update_card_updated_at
    BEFORE UPDATE
    ON card
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 9. Create trigger to automatically create card when flashcard is created
CREATE OR REPLACE FUNCTION public.handle_new_flashcard_card()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
DECLARE
    deck_owner UUID;
BEGIN
    -- Get the owner of the deck
    SELECT user_id INTO deck_owner FROM deck WHERE id = NEW.deck_id;

    -- Create a new card for this flashcard
    INSERT INTO public.card (flashcard_id, user_id)
    VALUES (NEW.id, deck_owner);

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_flashcard_created_card
    AFTER INSERT
    ON flashcard
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_flashcard_card();

-- 10. Create cards for all existing flashcards
INSERT INTO card (flashcard_id, user_id)
SELECT f.id, d.user_id
FROM flashcard f
JOIN deck d ON f.deck_id = d.id
WHERE NOT EXISTS (
    SELECT 1 FROM card c
    WHERE c.flashcard_id = f.id
);

-- Note: We're keeping flashcard_progress for now for backwards compatibility
-- It can be dropped in a future migration after data is verified

