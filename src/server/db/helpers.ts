import { and, eq, isNull, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { captureSessions, items, locations } from "./schema";

export function userScope(column: PgColumn, userId: string): SQL {
  if (!userId) {
    throw new Error("userId is required for user-scoped queries");
  }
  return eq(column, userId);
}

export function itemsForUser(userId: string): SQL {
  return userScope(items.userId, userId);
}

export function locationsForUser(userId: string): SQL {
  return userScope(locations.userId, userId);
}

export function captureSessionsForUser(userId: string): SQL {
  return userScope(captureSessions.userId, userId);
}

export function inboxItems(userId: string): SQL | undefined {
  return and(userScope(items.userId, userId), eq(items.status, "inbox"));
}

export function unsortedItems(userId: string): SQL | undefined {
  return and(userScope(items.userId, userId), isNull(items.locationId));
}
