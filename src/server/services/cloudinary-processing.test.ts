import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockExplicit } = vi.hoisted(() => ({
  mockExplicit: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/cloudinary", () => ({
  cloudinary: {
    uploader: {
      explicit: mockExplicit,
    },
  },
}));

vi.stubEnv("AUTH_URL", "https://totaltidy.example.com");

import { triggerBackgroundRemoval } from "./cloudinary-processing";

describe("triggerBackgroundRemoval", () => {
  beforeEach(() => {
    mockExplicit.mockClear();
  });

  it("calls cloudinary.uploader.explicit with correct parameters", async () => {
    await triggerBackgroundRemoval("totaltidy/abc123");

    expect(mockExplicit).toHaveBeenCalledOnce();
    expect(mockExplicit).toHaveBeenCalledWith("totaltidy/abc123", {
      type: "upload",
      eager: [{ effect: "e_background_removal" }],
      eager_async: true,
      eager_notification_url: "https://totaltidy.example.com/api/webhooks/cloudinary",
    });
  });

  it("constructs webhook URL from AUTH_URL", async () => {
    await triggerBackgroundRemoval("totaltidy/photo1");

    const callArgs = mockExplicit.mock.calls[0];
    expect(callArgs[1].eager_notification_url).toBe(
      "https://totaltidy.example.com/api/webhooks/cloudinary",
    );
  });

  it("falls back to VERCEL_URL when AUTH_URL is not set", async () => {
    const originalAuthUrl = process.env.AUTH_URL;
    process.env.AUTH_URL = "";
    process.env.VERCEL_URL = "totaltidy-abc.vercel.app";

    try {
      await triggerBackgroundRemoval("totaltidy/photo2");

      const callArgs = mockExplicit.mock.calls[0];
      expect(callArgs[1].eager_notification_url).toBe(
        "https://totaltidy-abc.vercel.app/api/webhooks/cloudinary",
      );
    } finally {
      process.env.AUTH_URL = originalAuthUrl;
      delete process.env.VERCEL_URL;
    }
  });

  it("throws when neither AUTH_URL nor VERCEL_URL is set", async () => {
    const originalAuthUrl = process.env.AUTH_URL;
    process.env.AUTH_URL = "";
    delete process.env.VERCEL_URL;

    try {
      await expect(triggerBackgroundRemoval("totaltidy/photo3")).rejects.toThrow(
        "AUTH_URL or VERCEL_URL must be set",
      );
    } finally {
      process.env.AUTH_URL = originalAuthUrl;
    }
  });

  it("propagates errors from cloudinary SDK", async () => {
    mockExplicit.mockRejectedValueOnce(new Error("Cloudinary API error"));

    await expect(triggerBackgroundRemoval("totaltidy/fail")).rejects.toThrow(
      "Cloudinary API error",
    );
  });
});
