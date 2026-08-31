# Russian-only redesign

## Overview

grammr was built as a multi-language grammar toolkit and the UI still said so:
seven languages in a sign-up wizard, a seven-tile home screen, a Tools page
holding one tool, an inflection form the dictionary had already superseded, and
deck management for a user who would only ever have one deck.

In practice it is a Russian-learning app used on a phone. This change makes the
UI say that, without narrowing the data model or the services underneath it.

**Scope of the honesty:** `LanguageCodeSchema`, `allLanguages`,
`inflectionConfig` and every Python Lambda keep their multi-language support.
Only what the reader is *offered* narrows. Adding a language back is publishing
a dictionary artifact and setting `dictionaryEnabled` — not widening a schema.

## What changed

| Was | Is |
|---|---|
| Two-step language wizard at sign-up | Profile auto-provisioned `en` → `ru` on first dashboard load |
| Card-grid home screen, seven tiles | Four tabs: Study, Cards, Dictionary, Translate |
| Deck list, rename, delete, filter, selector | Nothing. One deck, no UI for it |
| `/dashboard/inflect` + POS picker + submit | The dictionary, which already did this better |
| `/dashboard/tools` → transliterator page | A ЯЖ toggle inside the fields that need it |
| `GET /flashcards` returns everything | Paginated, infinite scroll |
| "View Inflections" on `word` cards only | One disclosure, identical for every back type |

## Decisions worth not re-litigating

**`ensureProfile` uses `onConflictDoNothing`, never `onConflictDoUpdate`.** It
runs on every dashboard render. An upsert there would reset every existing
user's language pair on every page view. `syncDeckStudies` likewise runs only on
the create branch, or each navigation pays for a public-deck scan.

**Pagination is offset, not keyset.** Keyset on `updatedAt` breaks the moment an
edit moves a row to the top mid-scroll. Offset has the same symptom for a
fraction of the machinery, and at these list sizes that is the right trade. The
`ORDER BY` carries an `id` tiebreaker because `updatedAt` is not unique — without
a total order Postgres can return the same row on two pages and drop another.

**A `phrase` card renders no disclosure trigger at all**, rather than one that
opens onto "no further detail". Same row shape, nothing shifts, nobody taps into
an empty drawer.

**Transliteration converts only the newly typed tail.** The mapping is not one
character to one (`sh` → `ш`), so re-converting the whole buffer per keystroke
would rewrite accepted text, drag the caret, and mangle Cyrillic already in the
field on a second pass. Non-append edits fall back to whole-buffer conversion.

**`viewportFit: "cover"` is load-bearing, not polish.** Without it every
`env(safe-area-inset-*)` resolves to zero on iOS and the bottom tab bar sits
under the home indicator.

**Overscroll suppression is gated behind `@media (display-mode: standalone)`.**
Inside the installed app pull-to-refresh reads as a glitch; in a browser tab it
is the browser's behaviour to offer and not ours to remove.

## Bugs found and fixed along the way

- `DashboardNav` took an `availableForLanguages` filter and a `learnedLanguage`
  prop the page never passed, so it never filtered anything. Deleted with the
  grid.
- `UserButton` nested a `<Link>` inside a `<Button>` — invalid HTML. Replaced by
  `UserMenu`.
- The dashboard layout caught database errors and redirected as though the
  profile were missing, presenting an outage as onboarding.
- `e2e` had a flashcard-search test that clicked a "Search" button which does not
  exist; its assertions were vacuous. Rewritten to seed 30 cards and exercise
  paging and filtering for real.

## Not done here

**Dropping non-Russian users.** The decision was to delete them outright rather
than migrate them to `ru`, but this is a manual, reviewed operation against
production and is *not* in a migration.

The blast radius is not what it looks like: `profiles`, `deck`, `deck_study`,
`flashcard_study` and `review_log` all cascade from **`auth.users.id`**, not from
`profiles`. Deleting a `profiles` row would orphan the decks and leave the auth
user, whom `ensureProfile` would then silently re-provision as a Russian learner
— the opposite of dropping them. The deletion has to target `auth.users`:

```sql
-- Snapshot the database first. Irreversible.
DELETE FROM auth.users u
USING public.profiles p
WHERE p.id = u.id AND p.target_language <> 'ru';
```

Before running it, check for public decks owned by a doomed user — their
subscribers lose all progress on them:

```sql
SELECT d.id, d.name FROM deck d
JOIN profiles p ON p.id = d.user_id
WHERE d.visibility = 'public' AND p.target_language <> 'ru';
```

Until this runs, a legacy `es`/`fr`/`it`/`pt` user sees a dictionary with no
artifact behind it. `src/app/dashboard/dictionary/page.tsx` no longer has a
fallback branch for that case — it assumes the cleanup has happened.

## Testing

`pnpm lint && pnpm typecheck && pnpm test` after each phase; 266 unit tests pass.
Note that Jest does not type check — the `WireDate`-is-a-`Date` mistake in the
study-card fixture only surfaced under `tsc`.

E2E collapses to `ru`, across three profiles: `chromium-ru`, `firefox-ru` and
`mobile-ru` (Pixel 7). The mobile project is not redundant — the tab bar,
safe-area padding and touch targets only exist below the `md` breakpoint, so a
desktop-only suite would never render them.

`task e2e` has **not** been run against a live stack for this change.

## Future work

- Cards from public decks still mix into the list with the user's own, now that
  the deck filter is gone. Only the `isOwner` check distinguishes them; a
  "shared" badge would help.
- The default deck's language is frozen at signup by `handle_new_profile()`.
  Harmless for new users, and moot once the cleanup above runs.
- `/dashboard/study` is a redirect kept for one release; remove it after that.
