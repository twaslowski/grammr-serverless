-- ============================================================================
-- LEGACY CLEANUP MIGRATION
-- Drops all legacy triggers, functions, and policies from Supabase migrations
-- This allows Drizzle to start fresh with the new consolidated schema
-- ============================================================================

-- ============================================================================
-- DROP LEGACY TRIGGERS
-- ============================================================================

-- Profile triggers (no longer auto-creating profiles on user signup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Deck triggers
DROP TRIGGER IF EXISTS on_auth_user_created_deck ON auth.users;
DROP TRIGGER IF EXISTS on_created_profile ON profiles;
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
DROP TRIGGER IF EXISTS update_deck_updated_at ON deck;
DROP TRIGGER IF EXISTS on_default_deck_created ON deck;

-- Flashcard triggers
DROP TRIGGER IF EXISTS update_flashcard_updated_at ON flashcard;
DROP TRIGGER IF EXISTS on_flashcard_created_card ON flashcard;
DROP TRIGGER IF EXISTS on_flashcard_created ON flashcard;

-- Card/FlashcardStudy triggers (card renamed to flashcard_study)
DROP TRIGGER IF EXISTS update_card_updated_at ON card;
DROP TRIGGER IF EXISTS update_flashcard_study_updated_at ON card;

-- Deck study triggers
DROP TRIGGER IF EXISTS update_deck_study_updated_at ON deck_study;
DROP TRIGGER IF EXISTS on_deck_study_created ON deck_study;
DROP TRIGGER IF EXISTS on_deck_study_deleted ON deck_study;

-- ============================================================================
-- DROP LEGACY FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user_deck();
DROP FUNCTION IF EXISTS public.handle_new_profile();
DROP FUNCTION IF EXISTS public.handle_default_deck_created();
DROP FUNCTION IF EXISTS public.handle_deck_created();
DROP FUNCTION IF EXISTS public.handle_new_flashcard_card();
DROP FUNCTION IF EXISTS public.handle_new_flashcard();
DROP FUNCTION IF EXISTS public.handle_new_deck_study();
DROP FUNCTION IF EXISTS public.handle_deck_study_deletion();
DROP FUNCTION IF EXISTS public.update_updated_at_column();

-- ============================================================================
-- DROP LEGACY POLICIES
-- ============================================================================

-- Profile policies
DROP POLICY IF EXISTS "Allow user access to their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can access their own profiles" ON profiles;

-- Deck policies
DROP POLICY IF EXISTS "Users can view their own decks" ON deck;
DROP POLICY IF EXISTS "Users can create their own decks" ON deck;
DROP POLICY IF EXISTS "Users can update their own decks" ON deck;
DROP POLICY IF EXISTS "Users can delete their own decks" ON deck;
DROP POLICY IF EXISTS "Users can view decks they study" ON deck;

-- Flashcard policies
DROP POLICY IF EXISTS "Users can view flashcards in their decks" ON flashcard;
DROP POLICY IF EXISTS "Users can create flashcards in their decks" ON flashcard;
DROP POLICY IF EXISTS "Users can update flashcards in their decks" ON flashcard;
DROP POLICY IF EXISTS "Users can delete flashcards in their decks" ON flashcard;
DROP POLICY IF EXISTS "Users can view flashcards in decks they study" ON flashcard;
DROP POLICY IF EXISTS "owned entity write access" ON flashcard;
DROP POLICY IF EXISTS "owned entity access" ON flashcard;
DROP POLICY IF EXISTS "public entity read access" ON flashcard;

-- Card policies (legacy table name)
DROP POLICY IF EXISTS "Users can view their own cards" ON card;
DROP POLICY IF EXISTS "Users can create their own cards" ON card;
DROP POLICY IF EXISTS "Users can update their own cards" ON card;
DROP POLICY IF EXISTS "Users can delete their own cards" ON card;
DROP POLICY IF EXISTS "owned entity access" ON card;

-- FlashcardStudy policies (new table name)
DROP POLICY IF EXISTS "owned entity access" ON card;

-- Review log policies
DROP POLICY IF EXISTS "Users can view their own review logs" ON review_log;
DROP POLICY IF EXISTS "Users can create their own review logs" ON review_log;
DROP POLICY IF EXISTS "owned entity access" ON review_log;

-- Deck study policies
DROP POLICY IF EXISTS "Users can manage their own deck studies" ON deck_study;
DROP POLICY IF EXISTS "owned entity access" ON deck_study;

-- ============================================================================
-- DROP LEGACY TABLES (if they still exist)
-- ============================================================================

DROP TABLE IF EXISTS flashcard_progress;

-- ============================================================================
-- RENAME CARD TO FLASHCARD_STUDY (if exists)
-- ============================================================================

ALTER TABLE IF EXISTS card RENAME TO flashcard_study;
ALTER TABLE review_log RENAME COLUMN card_id TO flashcard_study_id;

-- ============================================================================
-- DROP LEGACY INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_only_one_default_deck;
DROP INDEX IF EXISTS idx_unique_deck_name_per_user;
DROP INDEX IF EXISTS idx_card_due;
DROP INDEX IF EXISTS idx_card_user_state;
DROP INDEX IF EXISTS idx_card_deck_id;
DROP INDEX IF EXISTS idx_flashcard_study_due;
DROP INDEX IF EXISTS idx_flashcard_study_user_state;
DROP INDEX IF EXISTS idx_flashcard_study_deck_id;
DROP INDEX IF EXISTS idx_review_log_card_id;
DROP INDEX IF EXISTS idx_review_log_flashcard_study_id;
DROP INDEX IF EXISTS idx_card_due;
DROP INDEX IF EXISTS idx_card_user_state;
DROP INDEX IF EXISTS idx_card_deck_id;
DROP INDEX IF EXISTS idx_review_log_card_id;

