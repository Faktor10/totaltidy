import { describe, expect, it, vi } from "vitest";
import {
  handleBackgroundRemoval,
  parseWebhookPayload,
  verifyWebhookSignature,
} from "./cloudinary-webhook";

vi.mock("@/lib/cloudinary", () => ({
  cloudinary: {
    utils: {
      verifyNotificationSignature: vi.fn(
        (_body: string, _timestamp: number, signature: string) => signature === "valid-signature",
      ),
    },
  },
}));

describe("verifyWebhookSignature", () => {
  it("returns true for a valid signature", () => {
    expect(verifyWebhookSignature("{}", 1234567890, "valid-signature")).toBe(true);
  });

  it("returns false for an invalid signature", () => {
    expect(verifyWebhookSignature("{}", 1234567890, "bad-signature")).toBe(false);
  });
});

describe("handleBackgroundRemoval", () => {
  const publicId = "totaltidy/abc123";
  const processedUrl =
    "https://res.cloudinary.com/demo/image/upload/e_background_removal/totaltidy/abc123.jpg";

  function createMockDb(updateResult: unknown[] = [{ id: "item-001" }]) {
    return {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(updateResult),
          }),
        }),
      }),
    } as never;
  }

  it("updates processedImageUrl for matching item", async () => {
    const db = createMockDb();
    const result = await handleBackgroundRemoval(db, publicId, processedUrl);

    expect(result).toEqual({ updated: true });
    expect(db.update).toHaveBeenCalled();
  });

  it("returns updated false when no item matches the public ID", async () => {
    const db = createMockDb([]);
    const result = await handleBackgroundRemoval(db, publicId, processedUrl);

    expect(result).toEqual({ updated: false });
    expect(db.update).toHaveBeenCalled();
  });

  it("passes the correct processedUrl to the update", async () => {
    const db = createMockDb();
    await handleBackgroundRemoval(db, publicId, processedUrl);

    const setCall = db.update().set;
    expect(setCall).toHaveBeenCalledWith({ processedImageUrl: processedUrl });
  });
});

describe("parseWebhookPayload", () => {
  it("parses a valid webhook payload", () => {
    const raw = {
      notification_type: "background_removal",
      public_id: "totaltidy/abc123",
      secure_url: "https://res.cloudinary.com/demo/image/upload/totaltidy/abc123.jpg",
      resource_type: "image",
    };
    const result = parseWebhookPayload(raw);
    expect(result.notification_type).toBe("background_removal");
    expect(result.public_id).toBe("totaltidy/abc123");
  });

  it("throws for null body", () => {
    expect(() => parseWebhookPayload(null)).toThrow("Invalid Cloudinary webhook payload");
  });

  it("throws for missing notification_type", () => {
    expect(() => parseWebhookPayload({ public_id: "abc" })).toThrow(
      "Invalid Cloudinary webhook payload",
    );
  });

  it("throws for missing public_id", () => {
    expect(() => parseWebhookPayload({ notification_type: "info" })).toThrow(
      "Invalid Cloudinary webhook payload",
    );
  });

  it("throws for non-object body", () => {
    expect(() => parseWebhookPayload("not an object")).toThrow(
      "Invalid Cloudinary webhook payload",
    );
  });
});
