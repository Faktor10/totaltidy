import type { Database } from "@totaltidy/db";
import type { Location } from "@totaltidy/db/schema";
import { items, locations } from "@totaltidy/db/schema";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";

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

export async function getLocation(db: Database, userId: string, locationId: string) {
  const [location] = await db
    .select()
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.userId, userId)));

  return location ?? null;
}

const FREQUENCY_WEIGHT = 0.4;
const RECENCY_WEIGHT = 0.4;
const TIME_OF_DAY_WEIGHT = 0.2;
const RECENCY_HALF_LIFE_HOURS = 24;

export function scoreLocation(
  location: Pick<Location, "useCount" | "lastUsedAt">,
  now: Date,
  maxUseCount: number,
  timeOfDayRatio: number,
): number {
  const frequencyScore = maxUseCount > 0 ? location.useCount / maxUseCount : 0;

  let recencyScore = 0;
  if (location.lastUsedAt) {
    const hoursAgo = (now.getTime() - location.lastUsedAt.getTime()) / (1000 * 60 * 60);
    recencyScore = Math.exp((-hoursAgo * Math.LN2) / RECENCY_HALF_LIFE_HOURS);
  }

  return (
    FREQUENCY_WEIGHT * frequencyScore +
    RECENCY_WEIGHT * recencyScore +
    TIME_OF_DAY_WEIGHT * timeOfDayRatio
  );
}

export async function listLocationsPredicted(db: Database, userId: string) {
  const userLocations = await db.select().from(locations).where(eq(locations.userId, userId));

  if (userLocations.length === 0) return [];

  const now = new Date();
  const currentHour = now.getHours();
  const nearbyHours = [(currentHour - 1 + 24) % 24, currentHour, (currentHour + 1) % 24];

  const hourlyUsage = await db
    .select({
      locationId: items.locationId,
      hourCount: count(),
    })
    .from(items)
    .where(
      and(
        eq(items.userId, userId),
        sql`extract(hour from ${items.createdAt}) in (${sql.raw(nearbyHours.join(","))})`,
      ),
    )
    .groupBy(items.locationId);

  const totalsByLocation = await db
    .select({
      locationId: items.locationId,
      total: count(),
    })
    .from(items)
    .where(eq(items.userId, userId))
    .groupBy(items.locationId);

  const hourCountMap = new Map(hourlyUsage.map((r) => [r.locationId, Number(r.hourCount)]));
  const totalCountMap = new Map(totalsByLocation.map((r) => [r.locationId, Number(r.total)]));

  const maxUseCount = Math.max(...userLocations.map((l) => l.useCount), 1);

  const scored = userLocations.map((loc) => {
    const hourCount = hourCountMap.get(loc.id) ?? 0;
    const totalCount = totalCountMap.get(loc.id) ?? 0;
    const timeOfDayRatio = totalCount > 0 ? hourCount / totalCount : 0;

    return {
      ...loc,
      score: scoreLocation(loc, now, maxUseCount, timeOfDayRatio),
    };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map(({ score: _score, ...loc }) => loc);
}
