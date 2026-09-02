import { describe, expect, it } from "vitest";
import { hasItemsProcessing, POLLING_INTERVAL_MS } from "./use-gallery-polling";

describe("hasItemsProcessing", () => {
  it("returns false when items is undefined", () => {
    expect(hasItemsProcessing(undefined)).toBe(false);
  });

  it("returns false when items array is empty", () => {
    expect(hasItemsProcessing([])).toBe(false);
  });

  it("returns true when some items have no processedImageUrl", () => {
    const items = [
      { processedImageUrl: "https://example.com/processed.jpg" },
      { processedImageUrl: null },
    ];
    expect(hasItemsProcessing(items)).toBe(true);
  });

  it("returns false when all items have a processedImageUrl", () => {
    const items = [
      { processedImageUrl: "https://example.com/processed1.jpg" },
      { processedImageUrl: "https://example.com/processed2.jpg" },
    ];
    expect(hasItemsProcessing(items)).toBe(false);
  });

  it("returns true when all items are still processing", () => {
    const items = [{ processedImageUrl: null }, { processedImageUrl: null }];
    expect(hasItemsProcessing(items)).toBe(true);
  });

  it("returns true when a single item is still processing", () => {
    const items = [{ processedImageUrl: null }];
    expect(hasItemsProcessing(items)).toBe(true);
  });
});

describe("POLLING_INTERVAL_MS", () => {
  it("is set to 3000ms", () => {
    expect(POLLING_INTERVAL_MS).toBe(3000);
  });
});
