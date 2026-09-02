// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { triggerHaptic } from "./haptics";

describe("triggerHaptic", () => {
  let vibrateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vibrateMock = vi.fn(() => true);
    Object.defineProperty(navigator, "vibrate", {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls navigator.vibrate with default 50ms duration", () => {
    triggerHaptic();
    expect(vibrateMock).toHaveBeenCalledWith(50);
  });

  it("calls navigator.vibrate with custom duration", () => {
    triggerHaptic(100);
    expect(vibrateMock).toHaveBeenCalledWith(100);
  });

  it("returns true when vibration succeeds", () => {
    expect(triggerHaptic()).toBe(true);
  });

  it("returns false when navigator.vibrate is not available", () => {
    Object.defineProperty(navigator, "vibrate", {
      value: undefined,
      writable: true,
      configurable: true,
    });
    expect(triggerHaptic()).toBe(false);
  });
});
