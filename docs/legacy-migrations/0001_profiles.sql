-- ============================================================================
-- PROFILES TABLE
-- Stores user profile data with language preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS "profiles"
(
    id              UUID PRIMARY KEY        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    source_language TEXT                    NOT NULL,
    target_language TEXT                    NOT NULL,
    created_at      TIMESTAMP DEFAULT now() NOT NULL
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles
    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owned entity access"
    ON profiles
    FOR ALL
    USING ((SELECT auth.uid()) = id);
