DROP POLICY IF EXISTS "Users can view flashcards in their decks" ON flashcard;

CREATE POLICY "Users can view flashcards in decks they study"
    ON flashcard
    FOR SELECT
    USING (EXISTS (SELECT 1
                   FROM deck
                   WHERE deck.id = flashcard.deck_id
                     AND ((select auth.uid()) = deck.user_id OR deck.visibility = 'public')));

-- Add language column to deck table
ALTER TABLE deck
    ADD COLUMN language VARCHAR(3);

UPDATE deck d
SET language = (SELECT target_language FROM profiles p WHERE p.id = d.user_id);

DELETE FROM deck WHERE language IS NULL;

ALTER TABLE deck
    ALTER COLUMN language SET NOT NULL;

-- Update deck creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created_deck ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_deck();

CREATE OR REPLACE FUNCTION public.handle_new_profile()
    RETURNS trigger
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

CREATE TRIGGER on_created_profile
    AFTER INSERT
    ON public.profiles
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_profile();
