import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const {
  mockHandleBackgroundRemoval,
  mockHandleAutoTagging,
  mockExtractAutoTaggingData,
  mockIsAutoTaggingNotification,
} = vi.hoisted(() => ({
  mockHandleBackgroundRemoval: vi.fn().mockResolvedValue({ updated: true }),
  mockHandleAutoTagging: vi.fn().mockResolvedValue({ updated: true }),
  mockExtractAutoTaggingData: vi.fn().mockReturnValue(null),
  mockIsAutoTaggingNotification: vi.fn().mockReturnValue(false),
}));

vi.mock("@/server/db", () => ({
  db: {},
}));

vi.mock("@/server/services/cloudinary-webhook", () => ({
  verifyWebhookSignature: vi.fn(
    (_body: string, _timestamp: number, signature: string) => signature === "valid-sig",
  ),
  parseWebhookPayload: vi.fn((body: unknown) => body),
  handleBackgroundRemoval: mockHandleBackgroundRemoval,
  handleAutoTagging: mockHandleAutoTagging,
  extractAutoTaggingData: mockExtractAutoTaggingData,
  isAutoTaggingNotification: mockIsAutoTaggingNotification,
}));

function makeRequest(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost:3000/api/webhooks/cloudinary", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  });
}

describe("POST /api/webhooks/cloudinary", () => {
  it("rejects requests missing signature headers", async () => {
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Missing signature headers");
  });

  it("rejects requests with missing x-cld-signature", async () => {
    const res = await POST(makeRequest("{}", { "x-cld-timestamp": "1234567890" }));
    expect(res.status).toBe(401);
  });

  it("rejects requests with missing x-cld-timestamp", async () => {
    const res = await POST(makeRequest("{}", { "x-cld-signature": "some-sig" }));
    expect(res.status).toBe(401);
  });

  it("rejects requests with non-numeric timestamp", async () => {
    const res = await POST(
      makeRequest("{}", {
        "x-cld-signature": "valid-sig",
        "x-cld-timestamp": "not-a-number",
      }),
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Invalid timestamp");
  });

  it("rejects requests with invalid signature", async () => {
    const res = await POST(
      makeRequest("{}", {
        "x-cld-signature": "bad-sig",
        "x-cld-timestamp": "1234567890",
      }),
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Invalid signature");
  });

  it("rejects requests with malformed JSON", async () => {
    const res = await POST(
      makeRequest("not-json", {
        "x-cld-signature": "valid-sig",
        "x-cld-timestamp": "1234567890",
      }),
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid payload");
  });

  it("returns 200 and calls handleBackgroundRemoval for background_removal type", async () => {
    mockHandleBackgroundRemoval.mockClear();
    const body = JSON.stringify({
      notification_type: "background_removal",
      public_id: "totaltidy/abc123",
      secure_url: "https://res.cloudinary.com/demo/image/upload/totaltidy/abc123.jpg",
      resource_type: "image",
    });
    const res = await POST(
      makeRequest(body, {
        "x-cld-signature": "valid-sig",
        "x-cld-timestamp": "1234567890",
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(mockHandleBackgroundRemoval).toHaveBeenCalledWith(
      expect.anything(),
      "totaltidy/abc123",
      "https://res.cloudinary.com/demo/image/upload/totaltidy/abc123.jpg",
    );
  });

  it("does not call handleBackgroundRemoval for non-background_removal types", async () => {
    mockHandleBackgroundRemoval.mockClear();
    const body = JSON.stringify({
      notification_type: "info",
      public_id: "totaltidy/xyz",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
    });
    const res = await POST(
      makeRequest(body, {
        "x-cld-signature": "valid-sig",
        "x-cld-timestamp": "1234567890",
      }),
    );
    expect(res.status).toBe(200);
    expect(mockHandleBackgroundRemoval).not.toHaveBeenCalled();
  });

  it("returns 200 for valid webhook with unknown notification type", async () => {
    mockHandleBackgroundRemoval.mockClear();
    const body = JSON.stringify({
      notification_type: "unknown_event",
      public_id: "totaltidy/xyz",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
    });
    const res = await POST(
      makeRequest(body, {
        "x-cld-signature": "valid-sig",
        "x-cld-timestamp": "1234567890",
      }),
    );
    expect(res.status).toBe(200);
    expect(mockHandleBackgroundRemoval).not.toHaveBeenCalled();
  });

  it("calls handleAutoTagging when info notification is auto-tagging", async () => {
    mockHandleAutoTagging.mockClear();
    mockIsAutoTaggingNotification.mockReturnValue(true);
    const tagEntries = [
      { tag: "toy", confidence: 0.95 },
      { tag: "plastic", confidence: 0.8 },
    ];
    mockExtractAutoTaggingData.mockReturnValue(tagEntries);

    const body = JSON.stringify({
      notification_type: "info",
      info_kind: "categorization",
      public_id: "totaltidy/abc123",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
      info: {
        categorization: {
          imagga_tagging: {
            status: "complete",
            data: tagEntries,
          },
        },
      },
    });

    const res = await POST(
      makeRequest(body, {
        "x-cld-signature": "valid-sig",
        "x-cld-timestamp": "1234567890",
      }),
    );

    expect(res.status).toBe(200);
    expect(mockHandleAutoTagging).toHaveBeenCalledWith(
      expect.anything(),
      "totaltidy/abc123",
      tagEntries,
    );

    mockIsAutoTaggingNotification.mockReturnValue(false);
  });

  it("does not call handleAutoTagging when info notification is not auto-tagging", async () => {
    mockHandleAutoTagging.mockClear();
    mockIsAutoTaggingNotification.mockReturnValue(false);

    const body = JSON.stringify({
      notification_type: "info",
      public_id: "totaltidy/xyz",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
    });

    const res = await POST(
      makeRequest(body, {
        "x-cld-signature": "valid-sig",
        "x-cld-timestamp": "1234567890",
      }),
    );

    expect(res.status).toBe(200);
    expect(mockHandleAutoTagging).not.toHaveBeenCalled();
  });

  it("does not call handleAutoTagging when extractAutoTaggingData returns null", async () => {
    mockHandleAutoTagging.mockClear();
    mockIsAutoTaggingNotification.mockReturnValue(true);
    mockExtractAutoTaggingData.mockReturnValue(null);

    const body = JSON.stringify({
      notification_type: "info",
      info_kind: "categorization",
      public_id: "totaltidy/abc123",
      secure_url: "https://example.com/img.jpg",
      resource_type: "image",
    });

    const res = await POST(
      makeRequest(body, {
        "x-cld-signature": "valid-sig",
        "x-cld-timestamp": "1234567890",
      }),
    );

    expect(res.status).toBe(200);
    expect(mockHandleAutoTagging).not.toHaveBeenCalled();

    mockIsAutoTaggingNotification.mockReturnValue(false);
  });
});
