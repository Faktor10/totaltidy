import { eq } from "drizzle-orm";
import { cloudinary } from "@/lib/cloudinary";
import type { Database } from "@/server/db";
import { items } from "@/server/db/schema";

export interface CloudinaryWebhookPayload {
  notification_type: string;
  public_id: string;
  secure_url: string;
  resource_type: string;
  [key: string]: unknown;
}

export function verifyWebhookSignature(
  body: string,
  timestamp: number,
  signature: string,
): boolean {
  return cloudinary.utils.verifyNotificationSignature(body, timestamp, signature);
}

export async function handleBackgroundRemoval(
  db: Database,
  publicId: string,
  processedUrl: string,
): Promise<{ updated: boolean }> {
  const result = await db
    .update(items)
    .set({ processedImageUrl: processedUrl })
    .where(eq(items.cloudinaryPublicId, publicId))
    .returning({ id: items.id });

  return { updated: result.length > 0 };
}

export function parseWebhookPayload(body: unknown): CloudinaryWebhookPayload {
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).notification_type !== "string" ||
    typeof (body as Record<string, unknown>).public_id !== "string"
  ) {
    throw new Error("Invalid Cloudinary webhook payload");
  }

  return body as CloudinaryWebhookPayload;
}
