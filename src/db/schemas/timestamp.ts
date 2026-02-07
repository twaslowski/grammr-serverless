import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .default(sql`(now() AT TIME ZONE 'utc'::text)`)
    .notNull()
    .$onUpdate(() => sql`(now() AT TIME ZONE 'utc'::text)`),
};
