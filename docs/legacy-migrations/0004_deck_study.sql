-- ============================================================================
-- DECK_STUDY TABLE
-- Tracks which users are studying which decks (for shared deck functionality)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "deck_study"
(
    id              UUID PRIMARY KEY         DEFAULT gen_random_uuid()                NOT NULL,
    deck_id         INTEGER REFERENCES deck (id) ON DELETE CASCADE                    NOT NULL,
    user_id         UUID REFERENCES profiles (id) ON DELETE CASCADE                   NOT NULL,
    last_studied_at TIMESTAMP,
    is_active       BOOLEAN                  DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT (now() AT TIME ZONE 'utc'::text) NOT NULL,

    UNIQUE (deck_id, user_id)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE deck_study
    ENABLE ROW LEVEL SECURITY;

-- Users can manage their own deck studies
CREATE POLICY "owned entity access"
    ON deck_study
    FOR ALL
    USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Create deck_study when a default deck is created
CREATE OR REPLACE FUNCTION public.handle_deck_created()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
BEGIN
    INSERT INTO public.deck_study (deck_id, user_id, is_active)
    VALUES (NEW.id, NEW.user_id, TRUE)
    ON CONFLICT (deck_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_default_deck_created
    AFTER INSERT
    ON deck
    FOR EACH ROW
EXECUTE FUNCTION public.handle_deck_created();

