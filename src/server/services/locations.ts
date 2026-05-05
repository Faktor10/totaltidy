import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
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
  const [location] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.userId, userId), isNotNull(locations.lastUsedAt)))
    .orderBy(desc(locations.lastUsedAt))
    .limit(1);

  return location ?? null;
}
