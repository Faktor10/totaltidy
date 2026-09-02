import { cloudinary } from "../lib/cloudinary";

export const AUTO_TAGGING_CONFIDENCE_THRESHOLD = 0.6;

function getWebhookUrl(): string {
  const baseUrl = process.env.SERVER_URL;
  if (!baseUrl) {
    throw new Error("SERVER_URL must be set for Cloudinary webhook notifications");
  }
  return new URL("/api/webhooks/cloudinary", baseUrl).toString();
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

export async function triggerAutoTagging(publicId: string): Promise<void> {
  const notificationUrl = getWebhookUrl();

  await cloudinary.uploader.explicit(publicId, {
    type: "upload",
    categorization: "imagga_tagging",
    auto_tagging: AUTO_TAGGING_CONFIDENCE_THRESHOLD,
    notification_url: notificationUrl,
  });
}
