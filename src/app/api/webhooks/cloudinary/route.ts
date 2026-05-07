import { NextResponse } from "next/server";
import { db } from "@/server/db";
import {
  extractAutoTaggingData,
  handleAutoTagging,
  handleBackgroundRemoval,
  isAutoTaggingNotification,
  parseWebhookPayload,
  verifyWebhookSignature,
} from "@/server/services/cloudinary-webhook";

export async function POST(request: Request) {
  const signature = request.headers.get("x-cld-signature");
  const timestamp = request.headers.get("x-cld-timestamp");

  if (!signature || !timestamp) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
  }

  const rawBody = await request.text();
  const timestampNum = Number.parseInt(timestamp, 10);

  if (Number.isNaN(timestampNum)) {
    return NextResponse.json({ error: "Invalid timestamp" }, { status: 401 });
  }

  const isValid = verifyWebhookSignature(rawBody, timestampNum, signature);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: ReturnType<typeof parseWebhookPayload>;
  try {
    payload = parseWebhookPayload(JSON.parse(rawBody));
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
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

  return NextResponse.json({ received: true });
}
