-- Add ON DELETE CASCADE to profiles table
-- The profiles table references auth.users but was missing the cascade delete
-- This ensures that when a user is deleted from auth.users, their profile is also deleted

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE public.profiles
    DROP CONSTRAINT profiles_id_fkey;

-- Step 2: Re-add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_id_fkey
    FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

