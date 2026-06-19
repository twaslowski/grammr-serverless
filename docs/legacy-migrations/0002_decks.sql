-- ============================================================================
-- DECK TABLE
-- Stores flashcard decks owned by users
-- ============================================================================

CREATE TABLE IF NOT EXISTS "deck"
(
    id          SERIAL PRIMARY KEY                                                NOT NULL,
    name        TEXT                                                              NOT NULL,
    user_id     UUID REFERENCES profiles (id) ON DELETE CASCADE                   NOT NULL,
    visibility  TEXT                                                              NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    description TEXT,
    language    TEXT                                                              NOT NULL,
    is_default  BOOLEAN                  DEFAULT false                            NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Ensure only one default deck per user
CREATE UNIQUE INDEX idx_only_one_default_deck
    ON deck (user_id) WHERE (is_default = TRUE);

-- Ensure unique deck names per user (case-insensitive)
CREATE UNIQUE INDEX idx_unique_deck_name_per_user
    ON deck (user_id, LOWER(name));

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE deck
    ENABLE ROW LEVEL SECURITY;

-- Owners have full access to their decks
CREATE POLICY "owned entity access"
    ON deck
    FOR ALL
    USING ((SELECT auth.uid()) = user_id);

-- Anyone can read public decks
CREATE POLICY "public entity read access"
    ON deck
    FOR SELECT
    USING (visibility = 'public');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create a default deck when a new profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
BEGIN
    INSERT INTO public.deck (name, user_id, description, is_default, language)
    VALUES ('Default Deck', NEW.id, 'Your default flashcard deck', TRUE, NEW.target_language);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
    AFTER INSERT
    ON profiles
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_profile();
