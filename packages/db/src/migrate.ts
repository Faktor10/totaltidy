import path from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { client, type Database, db } from "./index";

const MIGRATIONS_FOLDER = path.resolve(import.meta.dirname, "../drizzle");

/**
 * Applied automatically on server startup in every environment — there is no
 * separate manual migration step for deploys.
 */
export async function runMigrations(database: Database = db): Promise<void> {
  await migrate(database, { migrationsFolder: MIGRATIONS_FOLDER });
}

async function main(): Promise<void> {
  console.log("Running migrations...");
  await runMigrations();
  console.log("Migrations complete.");
  await client.end();
}

// Only run as a CLI when invoked directly (`npm run db:migrate`).
if (process.argv[1] && import.meta.url === `file://${path.resolve(process.argv[1])}`) {
  main().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
}
