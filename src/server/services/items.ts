import { and, eq } from "drizzle-orm";
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
