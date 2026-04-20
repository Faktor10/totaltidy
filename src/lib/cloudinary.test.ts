import { describe, expect, it } from "vitest";
import { ALLOWED_FORMATS, MAX_FILE_SIZE, UPLOAD_FOLDER, UPLOAD_PRESET_NAME } from "./cloudinary";

describe("cloudinary config", () => {
  it("exports the correct upload folder", () => {
    expect(UPLOAD_FOLDER).toBe("totaltidy");
  });

  it("exports the correct preset name", () => {
    expect(UPLOAD_PRESET_NAME).toBe("totaltidy_unsigned");
  });

  it("allows common image formats", () => {
    expect(ALLOWED_FORMATS).toContain("jpg");
    expect(ALLOWED_FORMATS).toContain("jpeg");
    expect(ALLOWED_FORMATS).toContain("png");
    expect(ALLOWED_FORMATS).toContain("webp");
    expect(ALLOWED_FORMATS).toContain("heic");
  });

  it("sets a 10 MB max file size", () => {
    expect(MAX_FILE_SIZE).toBe(10_000_000);
  });
});
