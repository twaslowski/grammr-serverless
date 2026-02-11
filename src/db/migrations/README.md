# Migration Consolidation Summary

This document summarizes the changes made when consolidating legacy Supabase migrations into the new Drizzle-compatible
structure.

## Migration Files

| File                      | Description                                                                                      |
|---------------------------|--------------------------------------------------------------------------------------------------|
| `0000_cleanup_legacy.sql` | Drops all legacy triggers, functions, policies, and indexes; renames `card` to `flashcard_study` |
| `0000_tables.sql`         | Deprecated placeholder (no longer used)                                                          |
| `0001_profiles.sql`       | Profiles table with RLS                                                                          |
| `0002_decks.sql`          | Decks table with RLS, indexes (including case-insensitive unique name), and trigger              |
| `0003_flashcards.sql`     | Flashcards table with RLS                                                                        |
| `0004_deck_study.sql`     | Deck study table for shared deck functionality                                                   |
| `0005_fsrs.sql`           | FSRS tables (flashcard_study, review_log) with enums, indexes, RLS, and triggers                 |

## Legacy Migrations Consolidated

| Legacy Migration                                                   | Status         | Notes                                                                 |
|--------------------------------------------------------------------|----------------|-----------------------------------------------------------------------|
| `20260110100841_create_profile.sql`                                | ✅ Consolidated | Profile table moved to `0001_profiles.sql`                            |
| `20260114100000_create_flashcards.sql`                             | ✅ Consolidated | Split across `0002_decks.sql`, `0003_flashcards.sql`, `0005_fsrs.sql` |
| `20260119100000_add_not_null_constraints_to_profile_languages.sql` | ✅ Consolidated | NOT NULL constraints now in base table definition                     |
| `20260121162551_fsrs.sql`                                          | ✅ Consolidated | FSRS tables moved to `0005_fsrs.sql`                                  |
| `20260122171747_profile_deletion_cascade.sql`                      | ✅ Consolidated | CASCADE now in base table definition                                  |
| `20260128201531_flashcard_types.sql`                               | ✅ Consolidated | `type` column removed from flashcard table                            |
| `20260129145225_shared_decks.sql`                                  | ✅ Consolidated | Visibility column now in base deck table                              |
| `20260203172137_deck_study.sql`                                    | ✅ Consolidated | Deck study table moved to `0004_deck_study.sql`                       |
| `20260204123839_flashcard_visibility.sql`                          | ✅ Consolidated | RLS policies now in `0003_flashcards.sql`, language column in deck    |

## Changes Summary

### Table Renames

- **`card` → `flashcard_study`** - Renamed for consistency with `deck_study` pattern

### Foreign Key Changes

- All `user_id` columns now reference `profiles(id)` instead of `auth.users(id)`
- This provides a single user dependency point, making future auth provider migrations easier

### New Indexes

- **`idx_unique_deck_name_per_user`** - Case-insensitive unique constraint on deck names per user

### Removed/Obsolete

- **`update_updated_at_column()` trigger function** - Drizzle handles `updated_at` timestamps
- **`flashcard_progress` table** - Replaced by FSRS `flashcard_study` table
- **`flashcard.type` column** - No longer needed
- **`on_auth_user_created` trigger** - Profile is now created when user selects languages (onboarding flow)
- **`on_auth_user_created_deck` trigger** - Default deck now created via `on_profile_created` trigger

### Consolidated Triggers

| Trigger                   | Table      | Purpose                                                          |
|---------------------------|------------|------------------------------------------------------------------|
| `on_profile_created`      | profiles   | Creates default deck when profile is created                     |
| `on_default_deck_created` | deck       | Creates deck_study entry for deck owner                          |
| `on_flashcard_created`    | flashcard  | Creates flashcard_study entries for all users studying the deck  |
| `on_deck_study_created`   | deck_study | Creates flashcard_study entries when user starts studying a deck |
| `on_deck_study_deleted`   | deck_study | Deletes flashcard_study entries when user stops studying a deck  |

### Consolidated RLS Policies

All tables now use consistent policy naming:

- **`owned entity access`** - Full CRUD for entity owners
- **`public entity read access`** - SELECT for public visibility entities

| Table           | Policies                                           |
|-----------------|----------------------------------------------------|
| profiles        | `owned entity access`                              |
| deck            | `owned entity access`, `public entity read access` |
| flashcard       | `owned entity access`, `public entity read access` |
| deck_study      | `owned entity access`                              |
| flashcard_study | `owned entity access`                              |
| review_log      | `owned entity access`                              |

### FSRS Enums

Two PostgreSQL enums are created in `0005_fsrs.sql`:

- `card_state`: `'New'`, `'Learning'`, `'Review'`, `'Relearning'`
- `rating`: `'Again'`, `'Hard'`, `'Good'`, `'Easy'`

## Entity Relationship

```
profiles (1) ──┬── (N) deck
               │        │
               │        ├── (N) flashcard
               │        │        │
               │        │        └── (N) flashcard_study ── (N) review_log
               │        │                 │
               │        └── (N) deck_study ┘
               │                 │
               └─────────────────┘
```

All user-owned tables reference `profiles(id)` rather than `auth.users(id)`.

## Migration Order

When applying migrations to a fresh database:

1. `0000_cleanup_legacy.sql` - Clean slate (only needed for existing databases)
2. `0001_profiles.sql` - Profiles table
3. `0002_decks.sql` - Decks table (depends on profiles for FK and trigger)
4. `0003_flashcards.sql` - Flashcards table (depends on deck)
5. `0004_deck_study.sql` - Deck study table (depends on deck, profiles)
6. `0005_fsrs.sql` - FSRS tables (depends on flashcard, deck_study, profiles)

## Notes

- All timestamps now use `TIMESTAMP WITH TIME ZONE` with UTC default
- All foreign keys include `ON DELETE CASCADE`
- The cleanup migration should be run first on existing databases to ensure a clean state
- Legacy `supabase/migrations/` files can be archived or deleted after successful migration
- Deck names are unique per user (case-insensitive)
