import type { Database } from "@totaltidy/db";
import { items, locations } from "@totaltidy/db/schema";
import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { triggerAutoTagging, triggerBackgroundRemoval } from "./cloudinary-processing";
import { getLastUsedLocation } from "./locations";

async function touchLocation(db: Database, locationId: string) {
  await db
    .update(locations)
    .set({ lastUsedAt: new Date(), useCount: sql`${locations.useCount} + 1` })
    .where(eq(locations.id, locationId));
}

export function buildCloudinaryUrl(publicId: string): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error("CLOUDINARY_CLOUD_NAME is not configured");
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
}

export async function captureItem(
  db: Database,
  userId: string,
  input: {
    cloudinaryPublicId: string;
    locationId?: string;
    captureSessionId?: string;
  },
) {
  let resolvedLocationId = input.locationId;

  if (resolvedLocationId) {
    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, resolvedLocationId), eq(locations.userId, userId)));

    if (!location) {
      throw new Error("Location not found");
    }
  } else {
    const lastUsed = await getLastUsedLocation(db, userId);
    if (lastUsed) {
      resolvedLocationId = lastUsed.id;
    }
  }

  const originalImageUrl = buildCloudinaryUrl(input.cloudinaryPublicId);

  const [item] = await db
    .insert(items)
    .values({
      userId,
      cloudinaryPublicId: input.cloudinaryPublicId,
      originalImageUrl,
      locationId: resolvedLocationId ?? null,
      captureSessionId: input.captureSessionId ?? null,
      status: "inbox",
    })
    .returning();

  if (resolvedLocationId) {
    await touchLocation(db, resolvedLocationId);
  }

  triggerBackgroundRemoval(input.cloudinaryPublicId).catch(() => {});
  triggerAutoTagging(input.cloudinaryPublicId).catch(() => {});

  return item;
}

export async function listItems(db: Database, userId: string) {
  return db.select().from(items).where(eq(items.userId, userId)).orderBy(desc(items.createdAt));
}

export async function countInbox(db: Database, userId: string) {
  const [result] = await db
    .select({ count: count() })
    .from(items)
    .where(and(eq(items.userId, userId), isNull(items.locationId)));

  return result?.count ?? 0;
}

export async function listInbox(db: Database, userId: string) {
  return db
    .select()
    .from(items)
    .where(and(eq(items.userId, userId), isNull(items.locationId)))
    .orderBy(desc(items.createdAt));
}

export async function assignLocation(
  db: Database,
  userId: string,
  input: { itemId: string; locationId: string },
) {
  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.id, input.locationId), eq(locations.userId, userId)));

  if (!location) {
    throw new Error("Location not found");
  }

  const [item] = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.id, input.itemId), eq(items.userId, userId)));

  if (!item) {
    throw new Error("Item not found");
  }

  const [updated] = await db
    .update(items)
    .set({ locationId: input.locationId })
    .where(and(eq(items.id, input.itemId), eq(items.userId, userId)))
    .returning();

  await touchLocation(db, input.locationId);

  return updated;
}

export async function batchAssignLocation(db: Database, userId: string, locationId: string) {
  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.userId, userId)));

  if (!location) {
    throw new Error("Location not found");
  }

  const inboxItems = await db
    .select({ id: items.id })
    .from(items)
    .where(and(eq(items.userId, userId), isNull(items.locationId)));

  if (inboxItems.length === 0) {
    return { count: 0 };
  }

  const itemIds = inboxItems.map((i) => i.id);

  await db
    .update(items)
    .set({ locationId })
    .where(and(eq(items.userId, userId), inArray(items.id, itemIds)));

  await db
    .update(locations)
    .set({
      lastUsedAt: new Date(),
      useCount: sql`${locations.useCount} + ${inboxItems.length}`,
    })
    .where(and(eq(locations.id, locationId), eq(locations.userId, userId)));

  return { count: inboxItems.length };
}

export async function listItemsByLocation(db: Database, userId: string, locationId: string) {
  return db
    .select({
      id: items.id,
      originalImageUrl: items.originalImageUrl,
      processedImageUrl: items.processedImageUrl,
      label: items.label,
      tags: items.tags,
      status: items.status,
      createdAt: items.createdAt,
    })
    .from(items)
    .where(and(eq(items.userId, userId), eq(items.locationId, locationId)))
    .orderBy(desc(items.createdAt));
}

export async function listGalleryItems(db: Database, userId: string) {
  return db
    .select({
      id: items.id,
      originalImageUrl: items.originalImageUrl,
      processedImageUrl: items.processedImageUrl,
      label: items.label,
      tags: items.tags,
      status: items.status,
      locationId: items.locationId,
      locationName: locations.name,
      locationIcon: locations.icon,
      createdAt: items.createdAt,
    })
    .from(items)
    .leftJoin(locations, eq(items.locationId, locations.id))
    .where(eq(items.userId, userId))
    .orderBy(asc(locations.name), desc(items.createdAt));
}
