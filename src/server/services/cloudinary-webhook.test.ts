import { describe, expect, it, vi } from "vitest";
import type { AutoTagEntry, CloudinaryWebhookPayload } from "./cloudinary-webhook";
import {
  extractAutoTaggingData,
  handleAutoTagging,
  handleBackgroundRemoval,
  isAutoTaggingNotification,
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

describe("isAutoTaggingNotification", () => {
  it("returns true for categorization info notification", () => {
    const payload: CloudinaryWebhookPayload = {
      notification_type: "info",
      info_kind: "categorization",
      public_id: "totaltidy/abc123",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
    };
    expect(isAutoTaggingNotification(payload)).toBe(true);
  });

  it("returns false for non-info notification type", () => {
    const payload: CloudinaryWebhookPayload = {
      notification_type: "background_removal",
      info_kind: "categorization",
      public_id: "totaltidy/abc123",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
    };
    expect(isAutoTaggingNotification(payload)).toBe(false);
  });

  it("returns false for info notification without categorization kind", () => {
    const payload: CloudinaryWebhookPayload = {
      notification_type: "info",
      info_kind: "ocr",
      public_id: "totaltidy/abc123",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
    };
    expect(isAutoTaggingNotification(payload)).toBe(false);
  });

  it("returns false when info_kind is missing", () => {
    const payload: CloudinaryWebhookPayload = {
      notification_type: "info",
      public_id: "totaltidy/abc123",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
    };
    expect(isAutoTaggingNotification(payload)).toBe(false);
  });
});

describe("extractAutoTaggingData", () => {
  function makePayload(data: unknown, status = "complete"): CloudinaryWebhookPayload {
    return {
      notification_type: "info",
      info_kind: "categorization",
      public_id: "totaltidy/abc123",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
      info: {
        categorization: {
          imagga_tagging: { status, data },
        },
      },
    };
  }

  it("extracts and sorts tags by confidence descending", () => {
    const tags: AutoTagEntry[] = [
      { tag: "toy", confidence: 0.8 },
      { tag: "child", confidence: 0.95 },
      { tag: "indoor", confidence: 0.7 },
    ];
    const result = extractAutoTaggingData(makePayload(tags));
    expect(result).toEqual([
      { tag: "child", confidence: 0.95 },
      { tag: "toy", confidence: 0.8 },
      { tag: "indoor", confidence: 0.7 },
    ]);
  });

  it("returns null when info is missing", () => {
    const payload: CloudinaryWebhookPayload = {
      notification_type: "info",
      public_id: "totaltidy/abc123",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
    };
    expect(extractAutoTaggingData(payload)).toBeNull();
  });

  it("returns null when categorization is missing", () => {
    const payload: CloudinaryWebhookPayload = {
      notification_type: "info",
      public_id: "totaltidy/abc123",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
      info: {},
    };
    expect(extractAutoTaggingData(payload)).toBeNull();
  });

  it("returns null when imagga_tagging status is not complete", () => {
    const result = extractAutoTaggingData(
      makePayload([{ tag: "toy", confidence: 0.8 }], "pending"),
    );
    expect(result).toBeNull();
  });

  it("returns null when data is not an array", () => {
    const result = extractAutoTaggingData(makePayload("not-an-array"));
    expect(result).toBeNull();
  });

  it("filters out entries with invalid shape", () => {
    const data = [
      { tag: "toy", confidence: 0.8 },
      { tag: 123, confidence: 0.7 },
      { tag: "book", confidence: "high" },
      null,
      "invalid",
    ];
    const result = extractAutoTaggingData(makePayload(data));
    expect(result).toEqual([{ tag: "toy", confidence: 0.8 }]);
  });

  it("returns empty array when all entries are invalid", () => {
    const result = extractAutoTaggingData(makePayload([null, 42, "bad"]));
    expect(result).toEqual([]);
  });
});

describe("handleAutoTagging", () => {
  const publicId = "totaltidy/abc123";

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

  const tagEntries: AutoTagEntry[] = [
    { tag: "toy", confidence: 0.95 },
    { tag: "plastic", confidence: 0.8 },
    { tag: "child", confidence: 0.7 },
  ];

  it("updates label and tags for matching item", async () => {
    const db = createMockDb();
    const result = await handleAutoTagging(db, publicId, tagEntries);

    expect(result).toEqual({ updated: true });
    expect(db.update).toHaveBeenCalled();
  });

  it("sets label to the first (highest confidence) tag", async () => {
    const db = createMockDb();
    await handleAutoTagging(db, publicId, tagEntries);

    const setCall = db.update().set;
    expect(setCall).toHaveBeenCalledWith({
      label: "toy",
      tags: ["toy", "plastic", "child"],
    });
  });

  it("returns updated false when no item matches", async () => {
    const db = createMockDb([]);
    const result = await handleAutoTagging(db, publicId, tagEntries);

    expect(result).toEqual({ updated: false });
  });

  it("returns updated false for empty tag entries", async () => {
    const db = createMockDb();
    const result = await handleAutoTagging(db, publicId, []);

    expect(result).toEqual({ updated: false });
    expect(db.update).not.toHaveBeenCalled();
  });
});
