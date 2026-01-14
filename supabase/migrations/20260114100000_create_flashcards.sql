-- 1. Deck Table
CREATE TABLE deck
(
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255)                        NOT NULL,
    user_id     UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    description TEXT,
    is_default  BOOLEAN   DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Ensure only one 'is_default' deck per user
CREATE UNIQUE INDEX idx_only_one_default_deck
    ON deck (user_id) WHERE (is_default = TRUE);

-- 2. Flashcard Table
CREATE TABLE flashcard
(
    id         SERIAL PRIMARY KEY,
    deck_id    INT REFERENCES deck (id) ON DELETE CASCADE,
    front      TEXT                                NOT NULL, -- The word or phrase
    type       VARCHAR(50)                         NOT NULL CHECK (type IN ('word', 'phrase')),
    back       JSONB                               NOT NULL, -- e.g., {"translation": "...", "inflections": [...]}
    notes      TEXT,
    version    INT       DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Card Progress Table (The SRS Engine)
CREATE TABLE flashcard_progress
(
    id               SERIAL PRIMARY KEY,
    flashcard_id     INT REFERENCES flashcard (id) ON DELETE CASCADE,
    user_id          UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    -- SRS Fields
    ease_factor      FLOAT     DEFAULT 2.5,
    interval         INT       DEFAULT 0, -- Number of days
    repetitions      INT       DEFAULT 0, -- Successive successful reviews
    next_review_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_reviewed_at TIMESTAMP,

    UNIQUE (flashcard_id, user_id)
);

-- RLS Policies for deck
ALTER TABLE deck
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own decks"
    ON deck
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decks"
    ON deck
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own decks"
    ON deck
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decks"
    ON deck
    FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for flashcard (inherit through deck ownership)
ALTER TABLE flashcard
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view flashcards in their decks"
    ON flashcard
    FOR SELECT
    USING (
    EXISTS (SELECT 1
            FROM deck
            WHERE deck.id = flashcard.deck_id
              AND deck.user_id = auth.uid())
    );

CREATE POLICY "Users can create flashcards in their decks"
    ON flashcard
    FOR INSERT
    WITH CHECK (
    EXISTS (SELECT 1
            FROM deck
            WHERE deck.id = flashcard.deck_id
              AND deck.user_id = auth.uid())
    );

CREATE POLICY "Users can update flashcards in their decks"
    ON flashcard
    FOR UPDATE
    USING (
    EXISTS (SELECT 1
            FROM deck
            WHERE deck.id = flashcard.deck_id
              AND deck.user_id = auth.uid())
    );

CREATE POLICY "Users can delete flashcards in their decks"
    ON flashcard
    FOR DELETE
    USING (
    EXISTS (SELECT 1
            FROM deck
            WHERE deck.id = flashcard.deck_id
              AND deck.user_id = auth.uid())
    );

-- RLS Policies for flashcard_progress
ALTER TABLE flashcard_progress
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
    ON flashcard_progress
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own progress"
    ON flashcard_progress
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON flashcard_progress
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
    ON flashcard_progress
    FOR DELETE
    USING (auth.uid() = user_id);

-- Trigger to create default deck for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_deck()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
AS
$$
BEGIN
    INSERT INTO public.deck (name, user_id, description, is_default)
    VALUES ('Default Deck', NEW.id, 'Your default flashcard deck', TRUE);
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_deck
    AFTER INSERT
    ON auth.users
    FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_deck();

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER
    LANGUAGE plpgsql
AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Apply updated_at trigger to deck and flashcard tables
CREATE TRIGGER update_deck_updated_at
    BEFORE UPDATE
    ON deck
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_flashcard_updated_at
    BEFORE UPDATE
    ON flashcard
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create default deck for all existing users who don't have one
INSERT INTO deck (name, user_id, description, is_default)
SELECT 'Default Deck', id, 'Your default flashcard deck', TRUE
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM deck
    WHERE deck.user_id = auth.users.id
    AND deck.is_default = TRUE
);
