import { describe, expect, it } from "vitest";
import { buildConstraints } from "./use-camera";

describe("buildConstraints", () => {
  it("defaults to environment-facing camera with no audio", () => {
    const constraints = buildConstraints({});
    expect(constraints.audio).toBe(false);
    expect(constraints.video).toEqual({ facingMode: "environment" });
  });

  it("uses the specified facingMode", () => {
    const constraints = buildConstraints({ facingMode: "user" });
    expect(constraints.video).toMatchObject({ facingMode: "user" });
  });

  it("includes ideal width when specified", () => {
    const constraints = buildConstraints({ width: 1920 });
    expect(constraints.video).toMatchObject({
      facingMode: "environment",
      width: { ideal: 1920 },
    });
  });

  it("includes ideal height when specified", () => {
    const constraints = buildConstraints({ height: 1080 });
    expect(constraints.video).toMatchObject({
      facingMode: "environment",
      height: { ideal: 1080 },
    });
  });

  it("includes both width and height when specified", () => {
    const constraints = buildConstraints({ width: 1920, height: 1080 });
    expect(constraints.video).toEqual({
      facingMode: "environment",
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    });
  });

  it("omits width and height when not specified", () => {
    const constraints = buildConstraints({ facingMode: "user" });
    const video = constraints.video as MediaTrackConstraints;
    expect(video.width).toBeUndefined();
    expect(video.height).toBeUndefined();
  });
});
