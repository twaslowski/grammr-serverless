import "dotenv/config";

import { drizzle } from "drizzle-orm/postgres-js";

import { relations } from "./schemas/relations";

const connectionString = process.env.DATABASE_URL!;

// Disable prefetch as it is not supported for "Transaction" pool mode
export const db = drizzle(connectionString, { relations });
