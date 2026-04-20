import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/server/services/cloudinary-webhook", () => ({
  verifyWebhookSignature: vi.fn(
    (_body: string, _timestamp: number, signature: string) => signature === "valid-sig",
  ),
  parseWebhookPayload: vi.fn((body: unknown) => body),
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

  it("returns 200 for valid webhook with background_removal type", async () => {
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
  });

  it("returns 200 for valid webhook with unknown notification type", async () => {
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
  });
});
