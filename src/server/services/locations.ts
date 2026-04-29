import { asc, eq } from "drizzle-orm";
import type { Database } from "@/server/db";
import { locations } from "@/server/db/schema";

export async function listLocations(db: Database, userId: string) {
  return db
    .select()
    .from(locations)
    .where(eq(locations.userId, userId))
    .orderBy(asc(locations.sortOrder));
}
