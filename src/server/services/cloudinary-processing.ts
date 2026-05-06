import { cloudinary } from "@/lib/cloudinary";

function getWebhookUrl(): string {
  const baseUrl =
    process.env.AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  if (!baseUrl) {
    throw new Error("AUTH_URL or VERCEL_URL must be set for Cloudinary webhook notifications");
  }
  return `${baseUrl}/api/webhooks/cloudinary`;
}

export async function triggerBackgroundRemoval(publicId: string): Promise<void> {
  const notificationUrl = getWebhookUrl();

  await cloudinary.uploader.explicit(publicId, {
    type: "upload",
    eager: [{ effect: "e_background_removal" }],
    eager_async: true,
    eager_notification_url: notificationUrl,
  });
}
