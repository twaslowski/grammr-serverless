# Drizzle

## Design notes

When referencing a user, do so via the `profile` table. Avoid using Supabase's `auth.users` table directly, as it may
lead to complications in the future. The `profile` table serves as an abstraction layer, allowing for easier
modifications and maintenance down the line.

**Row-level security is not enforced on this connection.** Every table declares `pgPolicy` rules, but the role behind
`DATABASE_URL` bypasses them, so they do not protect application queries. Authorization has to be written explicitly
into every query that touches user data — see the "Authorization" section in `AGENTS.md`.

`connect.ts` exports a lazily-resolved singleton. It is lazy so that importing a module which touches the database does
not require `DATABASE_URL` at build time, and it sets `prepare: false` because prepared statements are unsupported by
the Supabase transaction pooler that `DATABASE_URL` points at.

## Layout

| File                   | Contents                                                  |
| ---------------------- | --------------------------------------------------------- |
| `connect.ts`           | The `db` handle                                           |
| `schemas/*.ts`         | One file per table                                        |
| `schemas/schema.ts`    | Re-exports every table; import tables from here           |
| `schemas/relations.ts` | Central `defineRelations()` call, passed to `drizzle()`   |
| `migrations/`          | Generated migrations — the source of truth for the schema |

`docs/legacy-migrations/` holds the pre-Drizzle SQL and is kept for reference only.

## Adding a new migration

- Define the new table in `schemas/`
- Re-export it from `schemas/schema.ts`
- Add any relations to `schemas/relations.ts`
- Run `pnpm db:generate --name <name>` to create the migration file
- Run `pnpm db:migrate` to apply it

`drizzle.config.ts` reads `DATABASE_URL`, falling back to the local Supabase instance started by `task start-env`.
Set `DATABASE_URL` to target any other environment.
