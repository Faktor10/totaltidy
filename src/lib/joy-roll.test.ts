import { describe, expect, it } from "vitest";
import { computeFloorSpaceReclaimed, formatDuration, getEncouragementMessage } from "./joy-roll";

describe("computeFloorSpaceReclaimed", () => {
  it("returns breathing room for 0 items", () => {
    expect(computeFloorSpaceReclaimed(0)).toBe("a bit of breathing room");
  });

  it("returns breathing room for 1 item (< 1 sq ft)", () => {
    expect(computeFloorSpaceReclaimed(1)).toBe("a bit of breathing room");
  });

  it("returns sq ft estimate for small counts", () => {
    expect(computeFloorSpaceReclaimed(3)).toBe("~2 sq ft of floor space");
  });

  it("returns closet metaphor for medium counts", () => {
    expect(computeFloorSpaceReclaimed(10)).toBe("~8 sq ft — a whole closet");
  });

  it("returns small room metaphor for larger counts", () => {
    expect(computeFloorSpaceReclaimed(20)).toBe("~15 sq ft — a small room");
  });

  it("returns whole room metaphor for very large counts", () => {
    expect(computeFloorSpaceReclaimed(40)).toBe("~30 sq ft — practically a whole room");
  });
});

describe("formatDuration", () => {
  it("formats durations under 60s as seconds", () => {
    expect(formatDuration(45000)).toBe("45s");
  });

  it("formats exact minutes without seconds", () => {
    expect(formatDuration(120000)).toBe("2m");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(90000)).toBe("1m 30s");
  });

  it("handles zero duration", () => {
    expect(formatDuration(0)).toBe("0s");
  });
});

describe("getEncouragementMessage", () => {
  it("returns ready message for 0 items", () => {
    expect(getEncouragementMessage(0)).toBe("Ready when you are!");
  });

  it("returns great start for 1-3 items", () => {
    expect(getEncouragementMessage(1)).toBe("Great start!");
    expect(getEncouragementMessage(3)).toBe("Great start!");
  });

  it("returns on a roll for 4-8 items", () => {
    expect(getEncouragementMessage(4)).toBe("You're on a roll!");
    expect(getEncouragementMessage(8)).toBe("You're on a roll!");
  });

  it("returns incredible session for 9-15 items", () => {
    expect(getEncouragementMessage(9)).toBe("Incredible session!");
    expect(getEncouragementMessage(15)).toBe("Incredible session!");
  });

  it("returns absolute legend for 16+ items", () => {
    expect(getEncouragementMessage(16)).toBe("Absolute legend!");
    expect(getEncouragementMessage(50)).toBe("Absolute legend!");
  });
});
