import { cloudinary } from "@/lib/cloudinary";

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
