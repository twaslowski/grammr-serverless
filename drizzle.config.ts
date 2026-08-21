import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// Defaults to the local Supabase instance started by `task start-env`.
// Set DATABASE_URL to target any other environment.
const LOCAL_DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schemas/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? LOCAL_DATABASE_URL,
  },
});
