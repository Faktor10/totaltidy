#!/usr/bin/env node
/**
 * CI guard: catches orphaned migration files or a journal that has drifted
 * from what is actually on disk under packages/db/drizzle.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DRIZZLE_DIR = path.resolve(import.meta.dirname, "../packages/db/drizzle");
const JOURNAL = path.join(DRIZZLE_DIR, "meta/_journal.json");

const errors = [];

const journal = JSON.parse(await readFile(JOURNAL, "utf8"));
const journalTags = journal.entries.map((entry) => entry.tag);

const sqlFiles = (await readdir(DRIZZLE_DIR))
  .filter((file) => file.endsWith(".sql"))
  .map((file) => file.replace(/\.sql$/, ""))
  .sort();

for (const tag of journalTags) {
  if (!sqlFiles.includes(tag)) {
    errors.push(`Journal references ${tag}.sql but that file is missing.`);
  }
}

for (const tag of sqlFiles) {
  if (!journalTags.includes(tag)) {
    errors.push(`Orphaned migration ${tag}.sql is not listed in the journal.`);
  }
}

const snapshots = (await readdir(path.join(DRIZZLE_DIR, "meta")))
  .filter((file) => file.endsWith("_snapshot.json"))
  .map((file) => file.replace(/_snapshot\.json$/, ""));

for (const entry of journal.entries) {
  const idx = String(entry.idx).padStart(4, "0");
  if (!snapshots.includes(idx)) {
    errors.push(`Journal entry ${entry.tag} has no meta/${idx}_snapshot.json.`);
  }
}

const indexes = journal.entries.map((entry) => entry.idx);
for (let i = 0; i < indexes.length; i += 1) {
  if (indexes[i] !== i) {
    errors.push(`Journal indexes are not contiguous: expected ${i}, got ${indexes[i]}.`);
  }
}

if (errors.length > 0) {
  console.error("Migration check failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Migration check passed (${journalTags.length} migrations).`);
