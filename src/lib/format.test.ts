import { describe, expect, it } from "vitest";
import { formatItemCount } from "./format";

describe("formatItemCount", () => {
  it("returns tidy message for zero items", () => {
    expect(formatItemCount(0)).toBe("All tidy!");
  });

  it("returns singular message for one item", () => {
    expect(formatItemCount(1)).toBe("1 item needs a home");
  });

  it("returns plural message for multiple items", () => {
    expect(formatItemCount(5)).toBe("5 items need a home");
  });
});
