// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CloudinaryUploadResult } from "@/lib/cloudinary-upload";
import * as cloudinaryUpload from "@/lib/cloudinary-upload";
import { useCloudinaryUpload } from "./use-cloudinary-upload";

const mockResult: CloudinaryUploadResult = {
  public_id: "totaltidy/abc123",
  secure_url: "https://res.cloudinary.com/test-cloud/image/upload/totaltidy/abc123.jpg",
  url: "http://res.cloudinary.com/test-cloud/image/upload/totaltidy/abc123.jpg",
  width: 1920,
  height: 1080,
  format: "jpg",
  resource_type: "image",
  created_at: "2026-04-26T00:00:00Z",
  bytes: 54321,
};

describe("useCloudinaryUpload", () => {
  beforeEach(() => {
    vi.spyOn(cloudinaryUpload, "uploadToCloudinary").mockResolvedValue(mockResult);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with idle state", () => {
    const { result } = renderHook(() => useCloudinaryUpload());

    expect(result.current.isUploading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastResult).toBeNull();
  });

  it("sets isUploading to true during upload", async () => {
    let resolveUpload!: (value: CloudinaryUploadResult) => void;
    vi.spyOn(cloudinaryUpload, "uploadToCloudinary").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        }),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const blob = new Blob(["image-data"], { type: "image/jpeg" });

    let uploadPromise: Promise<CloudinaryUploadResult | null>;
    act(() => {
      uploadPromise = result.current.upload(blob);
    });

    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      resolveUpload(mockResult);
      await uploadPromise;
    });

    expect(result.current.isUploading).toBe(false);
  });

  it("returns the CloudinaryUploadResult including public_id on success", async () => {
    const { result } = renderHook(() => useCloudinaryUpload());
    const blob = new Blob(["image-data"], { type: "image/jpeg" });

    let uploadResult: CloudinaryUploadResult | null = null;
    await act(async () => {
      uploadResult = await result.current.upload(blob);
    });

    expect(uploadResult).toEqual(mockResult);
    expect(uploadResult?.public_id).toBe("totaltidy/abc123");
    expect(result.current.lastResult).toEqual(mockResult);
  });

  it("calls uploadToCloudinary with the blob", async () => {
    const spy = vi.spyOn(cloudinaryUpload, "uploadToCloudinary").mockResolvedValue(mockResult);
    const { result } = renderHook(() => useCloudinaryUpload());
    const blob = new Blob(["image-data"], { type: "image/jpeg" });

    await act(async () => {
      await result.current.upload(blob);
    });

    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(blob);
  });

  it("sets error on upload failure and returns null", async () => {
    vi.spyOn(cloudinaryUpload, "uploadToCloudinary").mockRejectedValue(
      new Error("Cloudinary upload failed (400): Invalid preset"),
    );

    const { result } = renderHook(() => useCloudinaryUpload());
    const blob = new Blob(["image-data"], { type: "image/jpeg" });

    let uploadResult: CloudinaryUploadResult | null = null;
    await act(async () => {
      uploadResult = await result.current.upload(blob);
    });

    expect(uploadResult).toBeNull();
    expect(result.current.error).toBe("Cloudinary upload failed (400): Invalid preset");
    expect(result.current.isUploading).toBe(false);
    expect(result.current.lastResult).toBeNull();
  });

  it("handles non-Error thrown values gracefully", async () => {
    vi.spyOn(cloudinaryUpload, "uploadToCloudinary").mockRejectedValue("network down");

    const { result } = renderHook(() => useCloudinaryUpload());

    await act(async () => {
      await result.current.upload(new Blob(["data"]));
    });

    expect(result.current.error).toBe("Upload failed");
  });

  it("clears previous error on new upload", async () => {
    vi.spyOn(cloudinaryUpload, "uploadToCloudinary")
      .mockRejectedValueOnce(new Error("First failure"))
      .mockResolvedValueOnce(mockResult);

    const { result } = renderHook(() => useCloudinaryUpload());
    const blob = new Blob(["data"]);

    await act(async () => {
      await result.current.upload(blob);
    });
    expect(result.current.error).toBe("First failure");

    await act(async () => {
      await result.current.upload(blob);
    });
    expect(result.current.error).toBeNull();
    expect(result.current.lastResult).toEqual(mockResult);
  });

  it("reset clears error and lastResult", async () => {
    const { result } = renderHook(() => useCloudinaryUpload());

    await act(async () => {
      await result.current.upload(new Blob(["data"]));
    });
    expect(result.current.lastResult).toEqual(mockResult);

    act(() => {
      result.current.reset();
    });

    expect(result.current.lastResult).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
