import { db } from "@totaltidy/db";
import express, { type Request, type Response, Router } from "express";
import {
  extractAutoTaggingData,
  handleAutoTagging,
  handleBackgroundRemoval,
  isAutoTaggingNotification,
  parseWebhookPayload,
  verifyWebhookSignature,
} from "../services/cloudinary-webhook";

export async function handleCloudinaryWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.header("x-cld-signature");
  const timestamp = req.header("x-cld-timestamp");

  if (!signature || !timestamp) {
    res.status(401).json({ error: "Missing signature headers" });
    return;
  }

  const timestampNum = Number.parseInt(timestamp, 10);
  if (Number.isNaN(timestampNum)) {
    res.status(401).json({ error: "Invalid timestamp" });
    return;
  }

  // Signature is computed over the exact bytes Cloudinary sent, so this route
  // is mounted with a raw body parser rather than express.json().
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body ?? "");

  if (!verifyWebhookSignature(rawBody, timestampNum, signature)) {
    res.status(401).json({ error: "Invalid signature" });
    return;
  }

  let payload: ReturnType<typeof parseWebhookPayload>;
  try {
    payload = parseWebhookPayload(JSON.parse(rawBody));
  } catch {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  switch (payload.notification_type) {
    case "background_removal":
      await handleBackgroundRemoval(db, payload.public_id, payload.secure_url);
      break;
    case "info":
      if (isAutoTaggingNotification(payload)) {
        const tagEntries = extractAutoTaggingData(payload);
        if (tagEntries) {
          await handleAutoTagging(db, payload.public_id, tagEntries);
        }
      }
      break;
    default:
      break;
  }

  res.json({ received: true });
}

export function webhooksRouter(): Router {
  const router = Router();
  router.post("/cloudinary", express.raw({ type: "*/*", limit: "1mb" }), (req, res, next) => {
    handleCloudinaryWebhook(req, res).catch(next);
  });
  return router;
}
