-- Add NOT NULL constraints to profile language fields
-- This migration changes the profile creation flow:
-- - Previously: trigger created profile on user signup (with NULL languages)
-- - Now: profile is created when user selects their languages (with required languages)

-- Step 1: Drop the trigger that auto-creates profiles on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Delete any profiles that don't have languages set
-- (These users will need to complete onboarding to create their profile)
DELETE FROM public.profiles
WHERE source_language IS NULL
   OR target_language IS NULL;

-- Step 3: Add the NOT NULL constraints
ALTER TABLE public.profiles
    ALTER COLUMN source_language SET NOT NULL,
    ALTER COLUMN target_language SET NOT NULL;

