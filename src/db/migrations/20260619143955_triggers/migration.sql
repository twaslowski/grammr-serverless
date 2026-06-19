-- Custom SQL migration file, put your code below! --

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

