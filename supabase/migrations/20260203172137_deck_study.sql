------- MULTIPLE STEPS: Create deck_study table, add deck_id to card, set up RLS, create deck_study for default deck -------
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

CREATE OR REPLACE FUNCTION public.handle_default_deck_created()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
BEGIN
    -- If this deck is marked as default, create an active deck_study for the owner
    IF NEW.is_default = TRUE THEN
        INSERT INTO public.deck_study (deck_id, user_id, is_active)
        VALUES (NEW.id, NEW.user_id, TRUE)
        ON CONFLICT (deck_id, user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_default_deck_created
    AFTER INSERT
    ON deck
    FOR EACH ROW
EXECUTE FUNCTION public.handle_default_deck_created();

-- INITIALLY POPULATE deck_study table
INSERT INTO deck_study (deck_id, user_id)
SELECT d.id, d.user_id
FROM deck d
WHERE NOT EXISTS (SELECT 1
                  FROM deck_study ds
                  WHERE ds.deck_id = d.id
                    AND ds.user_id = d.user_id);

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
------- deck_study DONE -------

------- MULTIPLE STEPS: add deck_id to card, populate it, and set up constraints -------
ALTER TABLE card
    ADD COLUMN deck_id INT;

UPDATE card
SET deck_id = (SELECT f.deck_id
               FROM flashcard f
               WHERE f.id = card.flashcard_id);

-- Remove orphaned cards
DELETE
FROM card
WHERE flashcard_id NOT IN (SELECT id FROM flashcard);

ALTER TABLE card
    ALTER COLUMN deck_id SET NOT NULL;

ALTER TABLE card
    ADD CONSTRAINT fk_card_deck_id
        FOREIGN KEY (deck_id) REFERENCES deck (id) ON DELETE CASCADE;

CREATE INDEX idx_card_deck_id ON card (deck_id);
------- ADD deck_id DONE -------


-- EAGERLY CREATE cards
DROP TRIGGER IF EXISTS on_flashcard_created_card ON flashcard;
DROP FUNCTION IF EXISTS public.handle_new_flashcard_card();

-- 1. Create new trigger to create cards for all users studying the deck
CREATE OR REPLACE FUNCTION public.handle_new_flashcard_card()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
BEGIN
    -- Create a card for every user who is studying this deck
    INSERT INTO public.card (flashcard_id, user_id, deck_id)
    SELECT NEW.id, ds.user_id, NEW.deck_id
    FROM deck_study ds
    WHERE ds.deck_id = NEW.deck_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_flashcard_created_card
    AFTER INSERT
    ON flashcard
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_flashcard_card();

-- 2. Create trigger to create cards when user starts studying a deck
CREATE OR REPLACE FUNCTION public.handle_new_deck_study()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
BEGIN
    -- Create cards for all flashcards in this deck for the new user
    INSERT INTO public.card (flashcard_id, user_id, deck_id)
    SELECT f.id, NEW.user_id, NEW.deck_id
    FROM flashcard f
    WHERE f.deck_id = NEW.deck_id
    ON CONFLICT (flashcard_id, user_id) DO NOTHING; -- In case cards already exist

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_deck_study_created
    AFTER INSERT
    ON deck_study
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_deck_study();

-- 3. Create trigger to clean up cards when user stops studying a deck
-- This preserves data integrity but deletes user progress
CREATE OR REPLACE FUNCTION public.handle_deck_study_deletion()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
BEGIN
    -- Delete all cards for this user for this deck
    -- This cascades to review_log due to ON DELETE CASCADE
    DELETE FROM public.card
    WHERE user_id = OLD.user_id
      AND deck_id = OLD.deck_id;

    RETURN OLD;
END;
$$;

CREATE TRIGGER on_deck_study_deleted
    AFTER DELETE
    ON deck_study
    FOR EACH ROW
EXECUTE FUNCTION public.handle_deck_study_deletion();

-- 4. Create missing cards for existing deck_study relationships
-- This ensures all users studying a deck have cards for all flashcards
INSERT INTO card (flashcard_id, user_id, deck_id)
SELECT f.id, ds.user_id, f.deck_id
FROM flashcard f
         JOIN deck_study ds ON f.deck_id = ds.deck_id
WHERE NOT EXISTS (
    SELECT 1 FROM card c
    WHERE c.flashcard_id = f.id
      AND c.user_id = ds.user_id
)
ON CONFLICT (flashcard_id, user_id) DO NOTHING;
