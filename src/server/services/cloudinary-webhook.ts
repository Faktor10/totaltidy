import { eq } from "drizzle-orm";
import { cloudinary } from "@/lib/cloudinary";
import type { Database } from "@/server/db";
import { items } from "@/server/db/schema";

export interface CloudinaryWebhookPayload {
  notification_type: string;
  public_id: string;
  secure_url: string;
  resource_type: string;
  info_kind?: string;
  info_status?: string;
  [key: string]: unknown;
}

export interface AutoTagEntry {
  tag: string;
  confidence: number;
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

export function extractAutoTaggingData(payload: CloudinaryWebhookPayload): AutoTagEntry[] | null {
  const info = payload.info as Record<string, unknown> | undefined;
  if (!info) return null;

  const categorization = info.categorization as Record<string, unknown> | undefined;
  if (!categorization) return null;

  const imaggaTagging = categorization.imagga_tagging as Record<string, unknown> | undefined;
  if (!imaggaTagging || imaggaTagging.status !== "complete") return null;

  const data = imaggaTagging.data;
  if (!Array.isArray(data)) return null;

  return data
    .filter(
      (entry: unknown): entry is AutoTagEntry =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as AutoTagEntry).tag === "string" &&
        typeof (entry as AutoTagEntry).confidence === "number",
    )
    .sort((a, b) => b.confidence - a.confidence);
}

export async function handleAutoTagging(
  db: Database,
  publicId: string,
  tagEntries: AutoTagEntry[],
): Promise<{ updated: boolean }> {
  if (tagEntries.length === 0) {
    return { updated: false };
  }

  const label = tagEntries[0].tag;
  const tags = tagEntries.map((entry) => entry.tag);

  const result = await db
    .update(items)
    .set({ label, tags })
    .where(eq(items.cloudinaryPublicId, publicId))
    .returning({ id: items.id });

  return { updated: result.length > 0 };
}

export function isAutoTaggingNotification(payload: CloudinaryWebhookPayload): boolean {
  return payload.notification_type === "info" && payload.info_kind === "categorization";
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
