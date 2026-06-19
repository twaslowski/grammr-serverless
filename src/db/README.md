# Drizzle

## Design notes

When referencing a user, do so via the `profile` table. Avoid using Supabase's `auth.users` table directly, as it may
lead to complications in the future. The `profile` table serves as an abstraction layer, allowing for easier
modifications and maintenance down the line.

## Adding a new migration

- Define the new schema in `schemas`
- Import it in `migrations/index.ts` as outlined in that file
- Add any relations in `index.ts` as needed
- Run `pnpm drizzle-kit generate --name <name>` to create the migration file.
- Run `pnpm drizzle-kit migrate` to apply the migration to the database. This will also update the `drizzle.ts` file
  with the new schema definitions.
