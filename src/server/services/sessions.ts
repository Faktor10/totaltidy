import { and, count, eq, isNull } from "drizzle-orm";
import type { Database } from "@/server/db";
import { captureSessions, items } from "@/server/db/schema";

export async function startSession(db: Database, userId: string) {
  const [session] = await db.insert(captureSessions).values({ userId }).returning();

  return session;
}

export async function endSession(db: Database, userId: string, sessionId: string) {
  const [existing] = await db
    .select({ id: captureSessions.id, startedAt: captureSessions.startedAt })
    .from(captureSessions)
    .where(and(eq(captureSessions.id, sessionId), eq(captureSessions.userId, userId)));

  if (!existing) {
    throw new Error("Session not found");
  }

  const [itemCountResult] = await db
    .select({ count: count() })
    .from(items)
    .where(and(eq(items.captureSessionId, sessionId), eq(items.userId, userId)));

  const itemCount = itemCountResult?.count ?? 0;

  const [locationCountResult] = await db
    .select({ count: count(items.locationId) })
    .from(items)
    .where(and(eq(items.captureSessionId, sessionId), eq(items.userId, userId)));

  const locationsUsed = locationCountResult?.count ?? 0;

  const [unsortedResult] = await db
    .select({ count: count() })
    .from(items)
    .where(
      and(
        eq(items.captureSessionId, sessionId),
        eq(items.userId, userId),
        isNull(items.locationId),
      ),
    );

  const unsortedCount = unsortedResult?.count ?? 0;

  const endedAt = new Date();
  const durationMs = endedAt.getTime() - existing.startedAt.getTime();

  const summary = {
    itemsCaptured: itemCount,
    locationsUsed,
    unsortedItems: unsortedCount,
    durationMs,
  };

  const [updated] = await db
    .update(captureSessions)
    .set({ endedAt, itemCount, summary })
    .where(and(eq(captureSessions.id, sessionId), eq(captureSessions.userId, userId)))
    .returning();

  return updated;
}

export async function getSession(db: Database, userId: string, sessionId: string) {
  const [session] = await db
    .select()
    .from(captureSessions)
    .where(and(eq(captureSessions.id, sessionId), eq(captureSessions.userId, userId)));

  return session ?? null;
}
