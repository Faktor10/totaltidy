import { runMigrations } from "@totaltidy/db/migrate";
import { createApp } from "./app";
import { env } from "./lib/env";

async function main(): Promise<void> {
  // Migrations are applied automatically on startup in every environment —
  // there is no separate manual migration step for deploys.
  console.log("Running migrations...");
  await runMigrations();
  console.log("Migrations complete.");

  createApp().listen(env.port, () => {
    console.log(`TotalTidy API listening on ${env.serverUrl}`);
  });
}

main().catch((error) => {
  console.error("Server failed to start:", error);
  process.exit(1);
});
