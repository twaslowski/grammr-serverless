import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";

import { relations } from "./schemas/relations";

type Database = ReturnType<typeof createDb>;

function createDb() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  return drizzle({
    // Disable prepared statements: they are not supported by the connection
    // pooler in "Transaction" mode, which is what DATABASE_URL points at.
    connection: { url, prepare: false },
    relations,
  });
}

let instance: Database | undefined;

/**
 * Singleton database handle.
 *
 * Resolved lazily so that importing a module which touches the database does
 * not require DATABASE_URL to be present at build time.
 */
export const db = new Proxy({} as Database, {
  get(_target, property, receiver) {
    instance ??= createDb();
    return Reflect.get(instance, property, receiver);
  },
});
