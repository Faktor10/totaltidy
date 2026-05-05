import { asc, desc, eq } from "drizzle-orm";
import type { Database } from "@/server/db";
import { locations } from "@/server/db/schema";

export async function listLocations(db: Database, userId: string) {
  return db
    .select()
    .from(locations)
    .where(eq(locations.userId, userId))
    .orderBy(asc(locations.sortOrder));
}

export async function getLastUsedLocation(db: Database, userId: string) {
  const [byRecency] = await db
    .select()
    .from(locations)
    .where(eq(locations.userId, userId))
    .orderBy(desc(locations.lastUsedAt))
    .limit(1);

  if (byRecency?.lastUsedAt) return byRecency;

  const [bySortOrder] = await db
    .select()
    .from(locations)
    .where(eq(locations.userId, userId))
    .orderBy(asc(locations.sortOrder))
    .limit(1);

  return bySortOrder ?? null;
}
