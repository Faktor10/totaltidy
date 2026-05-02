import { and, desc, eq, isNull } from "drizzle-orm";
import type { Database } from "@/server/db";
import { items, locations } from "@/server/db/schema";

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
  },
) {
  if (input.locationId) {
    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, input.locationId), eq(locations.userId, userId)));

    if (!location) {
      throw new Error("Location not found");
    }
  }

  const originalImageUrl = buildCloudinaryUrl(input.cloudinaryPublicId);

  const [item] = await db
    .insert(items)
    .values({
      userId,
      cloudinaryPublicId: input.cloudinaryPublicId,
      originalImageUrl,
      locationId: input.locationId ?? null,
      status: "inbox",
    })
    .returning();

  return item;
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

  return updated;
}
