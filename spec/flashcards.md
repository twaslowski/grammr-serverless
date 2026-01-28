I want to give users the ability to create flashcards for studying.

## Database Entities

Each flashcard should have a "question" side and an "answer" side.
The "question" side will contain a prompt or question that the user wants to study.
This will be a word or a phrase.
The "answer" side will either contain a translation of that phrase into their "source language"
or the translation of that word alongside an inflection table.

Each note should belong to a deck. By default, this can be abstracted away from the user.
Decks may be added later, but for now the user will receive a default deck when signing up
which all flashcards will belong to.

I will also want to build a rough capability for spaced repetition later.
Let's consider that when designing the schema: Will the flashcard have to hold any information, or can this be tracked in a separate table?

This is what the entities should look like:

```sql
CREATE TABLE deck (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
description TEXT,
is_default BOOLEAN DEFAULT FALSE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Ensure only one 'is_default' deck per user
CREATE UNIQUE INDEX idx_only_one_default_deck
ON deck (user_id) WHERE (is_default = TRUE);

-- 2. Flashcard Table (Refined for structure)
CREATE TABLE flashcard (
id SERIAL PRIMARY KEY,
deck_id INT REFERENCES deck(id) ON DELETE CASCADE,
front TEXT NOT NULL, -- The word or phrase
type VARCHAR(50) NOT NULL CHECK (type IN ('word', 'phrase')),
back JSONB NOT NULL,  -- e.g., {"translation": "...", "inflections": [...]}
notes TEXT,
version INT DEFAULT 1,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Card Progress Table (The SRS Engine)
CREATE TABLE flashcard_progress (
id SERIAL PRIMARY KEY,
flashcard_id INT REFERENCES flashcard(id) ON DELETE CASCADE UNIQUE,
user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
-- SRS Fields
ease_factor FLOAT DEFAULT 2.5,
interval INT DEFAULT 0,          -- Number of days
repetitions INT DEFAULT 0,       -- Successive successful reviews
next_review_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
last_reviewed_at TIMESTAMP,

UNIQUE(flashcard_id, user_id)
);
```

Set up RLS policies to ensure that users can only access their own decks and flashcards.
Also set up a trigger so that anytime a user signs up, a default deck is created for them.
This can be similar to what is done with the profile.

## APIs

Set up a capability for users to create flashcards.
I want to avoid using server actions and stick to routes and API endpoints, because I dislike NextJS magic.
Set up CRUD routes at `/api/v1/flashcards` for managing flashcards.

## Frontend

Create a component that allows users to create flashcards.
It should be possible to use it from places like the `translated-word.tsx` or `inflection-form.tsx` components.
The front should contain either a word or phrase in the learned language.
The back should contain either a translation or a translation alongside an inflection table.
If data is missing, users should be able to request it with a button that fetches the data from the backend.
If data cannot be retrieved, an error message should be shown. However, that should not stop them from creating the
flashcard with incomplete data (as long as all non-null fields are present).

Create a new page at `/dashboard/flashcards` that shows all flashcards in a list.
Users should be able to filter flashcards by deck, search for specific flashcards,
and sort them by creation date or last reviewed date.
