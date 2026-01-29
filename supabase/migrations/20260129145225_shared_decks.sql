ALTER TABLE deck
    ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private'
        CHECK (visibility IN ('private', 'public'));

-- Update RLS policies for deck
DROP POLICY IF EXISTS "Users can view their own decks" ON deck;
CREATE POLICY "Users can view their own decks"
    ON deck
    FOR SELECT
    USING ((select auth.uid()) = user_id OR visibility = 'public');
