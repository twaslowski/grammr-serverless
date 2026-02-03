-- Create deck_study table with proper constraints and metadata
CREATE TABLE deck_study (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id INT REFERENCES deck (id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    last_studied_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,

    UNIQUE(deck_id, user_id)
);

-- Enable RLS
ALTER TABLE deck_study ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own deck studies"
    ON deck_study
    FOR ALL
    USING ((select auth.uid()) = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_deck_study_updated_at
    BEFORE UPDATE ON deck_study
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
