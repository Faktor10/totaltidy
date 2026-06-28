import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import postgres from "postgres";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const url = process.env.DATABASE_URL;

// Neon serverless driver for hosted DB; standard postgres for local dev.
export const db = url.includes("neon.tech")
  ? drizzleNeon(neon(url), { schema })
  : drizzlePg(postgres(url), { schema });

export type Database = typeof db;
