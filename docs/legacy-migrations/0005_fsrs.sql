-- ============================================================================
-- FSRS TABLES (Free Spaced Repetition Scheduler)
-- FlashcardStudy and ReviewLog tables for SRS functionality
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- CREATE TYPE card_state AS ENUM ('New', 'Learning', 'Review', 'Relearning');
-- CREATE TYPE rating AS ENUM ('Again', 'Hard', 'Good', 'Easy');

-- ============================================================================
-- FLASHCARD_STUDY TABLE
-- Stores FSRS card state for each flashcard per user (analogous to deck_study)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "flashcard_study"
(
    id             SERIAL PRIMARY KEY                                                NOT NULL,
    flashcard_id   INTEGER REFERENCES flashcard (id) ON DELETE CASCADE               NOT NULL,
    user_id        UUID REFERENCES profiles (id) ON DELETE CASCADE                   NOT NULL,
    deck_id        INTEGER REFERENCES deck (id) ON DELETE CASCADE                    NOT NULL,
    -- FSRS fields
    due            TIMESTAMP                DEFAULT now()                            NOT NULL,
    stability      DOUBLE PRECISION         DEFAULT 0                                NOT NULL,
    difficulty     DOUBLE PRECISION         DEFAULT 0                                NOT NULL,
    elapsed_days   INTEGER                  DEFAULT 0                                NOT NULL,
    scheduled_days INTEGER                  DEFAULT 0                                NOT NULL,
    learning_steps INTEGER                  DEFAULT 0                                NOT NULL,
    reps           INTEGER                  DEFAULT 0                                NOT NULL,
    lapses         INTEGER                  DEFAULT 0                                NOT NULL,
    state          card_state               DEFAULT 'New'                            NOT NULL,
    last_review    TIMESTAMP,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,

    UNIQUE (flashcard_id, user_id)
);

-- ============================================================================
-- REVIEW_LOG TABLE
-- Stores review history for analytics and FSRS optimization
-- ============================================================================

CREATE TABLE IF NOT EXISTS "review_log"
(
    id                SERIAL PRIMARY KEY                                        NOT NULL,
    flashcard_study_id INTEGER REFERENCES flashcard_study (id) ON DELETE CASCADE NOT NULL,
    -- FSRS review log fields
    rating            rating                                                    NOT NULL,
    state             card_state                                                NOT NULL,
    due               TIMESTAMP                                                 NOT NULL,
    stability         DOUBLE PRECISION                                          NOT NULL,
    difficulty        DOUBLE PRECISION                                          NOT NULL,
    elapsed_days      INTEGER                                                   NOT NULL,
    last_elapsed_days INTEGER                                                   NOT NULL,
    scheduled_days    INTEGER                                                   NOT NULL,
    learning_steps    INTEGER                                                   NOT NULL,
    review            TIMESTAMP DEFAULT now()                                   NOT NULL,
    created_at        TIMESTAMP DEFAULT now()                                   NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_flashcard_study_due ON flashcard_study (user_id, due) WHERE state != 'New';
CREATE INDEX idx_flashcard_study_user_state ON flashcard_study (user_id, state);
CREATE INDEX idx_flashcard_study_deck_id ON flashcard_study (deck_id);
CREATE INDEX idx_review_log_flashcard_study_id ON review_log (flashcard_study_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE flashcard_study
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_log
    ENABLE ROW LEVEL SECURITY;

-- FlashcardStudy: Users can manage their own flashcard studies
CREATE POLICY "owned entity access"
    ON flashcard_study
    FOR ALL
    USING ((SELECT auth.uid()) = user_id);

-- ReviewLog: Users can manage review logs for their flashcard studies
CREATE POLICY "owned entity access"
    ON review_log
    FOR ALL
    USING (
    EXISTS (SELECT 1
            FROM flashcard_study
            WHERE flashcard_study.id = review_log.flashcard_study_id
              AND flashcard_study.user_id = (SELECT auth.uid()))
    );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create flashcard_study entries for all users studying a deck when a flashcard is created
CREATE OR REPLACE FUNCTION public.handle_new_flashcard()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
BEGIN
    INSERT INTO public.flashcard_study (flashcard_id, user_id, deck_id)
    SELECT NEW.id, ds.user_id, NEW.deck_id
    FROM deck_study ds
    WHERE ds.deck_id = NEW.deck_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_flashcard_created
    AFTER INSERT
    ON flashcard
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_flashcard();

-- Create flashcard_study entries for all flashcards when a user starts studying a deck
CREATE OR REPLACE FUNCTION public.handle_new_deck_study()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
BEGIN
    INSERT INTO public.flashcard_study (flashcard_id, user_id, deck_id)
    SELECT f.id, NEW.user_id, NEW.deck_id
    FROM flashcard f
    WHERE f.deck_id = NEW.deck_id
    ON CONFLICT (flashcard_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_deck_study_created
    AFTER INSERT
    ON deck_study
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_deck_study();

-- Clean up flashcard_study entries when a user stops studying a deck
CREATE OR REPLACE FUNCTION public.handle_deck_study_deletion()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
BEGIN
    DELETE
    FROM public.flashcard_study
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

