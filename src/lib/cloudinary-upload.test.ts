import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadToCloudinary } from "./cloudinary-upload";

const MOCK_CLOUD_NAME = "test-cloud";
const MOCK_PRESET = "totaltidy_unsigned";

const mockUploadResult = {
  public_id: "totaltidy/abc123",
  secure_url: "https://res.cloudinary.com/test-cloud/image/upload/totaltidy/abc123.jpg",
  url: "http://res.cloudinary.com/test-cloud/image/upload/totaltidy/abc123.jpg",
  width: 800,
  height: 600,
  format: "jpg",
  resource_type: "image",
  created_at: "2026-04-19T00:00:00Z",
  bytes: 12345,
};

describe("uploadToCloudinary", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = MOCK_CLOUD_NAME;
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET = MOCK_PRESET;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("throws when NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is missing", async () => {
    delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    await expect(uploadToCloudinary(new Blob(["test"]))).rejects.toThrow(
      "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not configured",
    );
  });

  it("throws when NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is missing", async () => {
    delete process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    await expect(uploadToCloudinary(new Blob(["test"]))).rejects.toThrow(
      "NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET is not configured",
    );
  });

  it("sends a POST to the correct Cloudinary endpoint", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(mockUploadResult), { status: 200 }));

    await uploadToCloudinary(new Blob(["image-data"], { type: "image/jpeg" }));

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, options] = fetchSpy.mock.calls[0];
    expect(url).toBe(`https://api.cloudinary.com/v1_1/${MOCK_CLOUD_NAME}/image/upload`);
    expect(options?.method).toBe("POST");
  });

  it("includes the upload preset in the form data", async () => {
    let capturedBody: FormData | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      capturedBody = init?.body as FormData;
      return new Response(JSON.stringify(mockUploadResult), { status: 200 });
    });

    await uploadToCloudinary(new Blob(["image-data"]));

    expect(capturedBody).toBeInstanceOf(FormData);
    expect(capturedBody?.get("upload_preset")).toBe(MOCK_PRESET);
  });

  it("includes the blob as the file field", async () => {
    let capturedBody: FormData | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (_url, init) => {
      capturedBody = init?.body as FormData;
      return new Response(JSON.stringify(mockUploadResult), { status: 200 });
    });

    const blob = new Blob(["image-data"], { type: "image/jpeg" });
    await uploadToCloudinary(blob);

    const file = capturedBody?.get("file");
    expect(file).toBeInstanceOf(Blob);
  });

  it("returns parsed upload result on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockUploadResult), { status: 200 }),
    );

    const result = await uploadToCloudinary(new Blob(["image-data"]));

    expect(result.public_id).toBe("totaltidy/abc123");
    expect(result.secure_url).toContain("res.cloudinary.com");
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
  });

  it("throws on non-OK response with status and body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"error":{"message":"Invalid preset"}}', { status: 400 }),
    );

    await expect(uploadToCloudinary(new Blob(["test"]))).rejects.toThrow(
      "Cloudinary upload failed (400)",
    );
  });
});
