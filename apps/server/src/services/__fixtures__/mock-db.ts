import type { Database } from "@totaltidy/db";
import type { Mock } from "vitest";

/**
 * Service tests hand-roll just the slice of the Drizzle builder chain they
 * exercise. Casting to this keeps the mock assignable to the `Database` the
 * services take, while `expect(db.insert)` still resolves to a spy.
 */
export type MockDatabase = Database & Record<string, Mock>;
