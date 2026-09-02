import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

/**
 * One long-lived pooled connection for the Express server. Neon, Railway and a
 * local Postgres all speak plain TCP, so a single `postgres-js` client covers
 * every environment — no serverless-HTTP driver branch needed.
 */
export const client = postgres(process.env.DATABASE_URL, { max: 10 });

export const db = drizzle(client, { schema });

export type Database = typeof db;

export * as schema from "./schema";
