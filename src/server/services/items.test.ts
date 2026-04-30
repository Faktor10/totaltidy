import { describe, expect, it, vi } from "vitest";
import { assignLocation, buildCloudinaryUrl, captureItem } from "./items";

vi.stubEnv("CLOUDINARY_CLOUD_NAME", "test-cloud");

describe("buildCloudinaryUrl", () => {
  it("constructs URL from public ID and cloud name", () => {
    const url = buildCloudinaryUrl("totaltidy/abc123");
    expect(url).toBe("https://res.cloudinary.com/test-cloud/image/upload/totaltidy/abc123");
  });

  it("throws when CLOUDINARY_CLOUD_NAME is not set", () => {
    const original = process.env.CLOUDINARY_CLOUD_NAME;
    process.env.CLOUDINARY_CLOUD_NAME = "";
    try {
      expect(() => buildCloudinaryUrl("test")).toThrow("CLOUDINARY_CLOUD_NAME is not configured");
    } finally {
      process.env.CLOUDINARY_CLOUD_NAME = original;
    }
  });
});

describe("captureItem", () => {
  const userId = "user-abc-123";
  const mockItem = {
    id: "item-001",
    userId,
    cloudinaryPublicId: "totaltidy/photo1",
    originalImageUrl: "https://res.cloudinary.com/test-cloud/image/upload/totaltidy/photo1",
    processedImageUrl: null,
    locationId: null,
    captureSessionId: null,
    label: null,
    tags: null,
    category: null,
    status: "inbox" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createMockDb(overrides?: { selectResult?: unknown[]; insertResult?: unknown[] }) {
    const selectResult = overrides?.selectResult ?? [];
    const insertResult = overrides?.insertResult ?? [mockItem];

    return {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(selectResult),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(insertResult),
        }),
      }),
    } as never;
  }

  it("creates an item with status inbox and no location", async () => {
    const db = createMockDb();
    const result = await captureItem(db, userId, {
      cloudinaryPublicId: "totaltidy/photo1",
    });

    expect(result).toEqual(mockItem);
    expect(db.insert).toHaveBeenCalled();
  });

  it("creates an item with a valid location", async () => {
    const locationId = "loc-001";
    const itemWithLocation = { ...mockItem, locationId };
    const db = createMockDb({
      selectResult: [{ id: locationId }],
      insertResult: [itemWithLocation],
    });

    const result = await captureItem(db, userId, {
      cloudinaryPublicId: "totaltidy/photo1",
      locationId,
    });

    expect(result).toEqual(itemWithLocation);
    expect(db.select).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
  });

  it("throws when location does not belong to user", async () => {
    const db = createMockDb({ selectResult: [] });

    await expect(
      captureItem(db, userId, {
        cloudinaryPublicId: "totaltidy/photo1",
        locationId: "nonexistent-loc",
      }),
    ).rejects.toThrow("Location not found");

    expect(db.insert).not.toHaveBeenCalled();
  });

  it("does not query locations when locationId is not provided", async () => {
    const db = createMockDb();
    await captureItem(db, userId, {
      cloudinaryPublicId: "totaltidy/photo1",
    });

    expect(db.select).not.toHaveBeenCalled();
  });
});

describe("assignLocation", () => {
  const userId = "user-abc-123";
  const itemId = "item-001";
  const locationId = "loc-001";
  const updatedItem = {
    id: itemId,
    userId,
    locationId,
    cloudinaryPublicId: "totaltidy/photo1",
    originalImageUrl: "https://res.cloudinary.com/test-cloud/image/upload/totaltidy/photo1",
    processedImageUrl: null,
    captureSessionId: null,
    label: null,
    tags: null,
    category: null,
    status: "inbox" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createMockDb(overrides?: { selectResults?: unknown[][]; updateResult?: unknown[] }) {
    const selectResults = overrides?.selectResults ?? [[{ id: locationId }], [{ id: itemId }]];
    const updateResult = overrides?.updateResult ?? [updatedItem];
    let selectCallCount = 0;

    const mockUpdateSet = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(updateResult),
      }),
    });
    const mockUpdateSetNoReturn = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    let updateCallCount = 0;
    return {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            const result = selectResults[selectCallCount] ?? [];
            selectCallCount++;
            return Promise.resolve(result);
          }),
        }),
      }),
      update: vi.fn().mockImplementation(() => {
        updateCallCount++;
        if (updateCallCount === 1) {
          return { set: mockUpdateSet };
        }
        return { set: mockUpdateSetNoReturn };
      }),
    } as never;
  }

  it("assigns a location to an item and returns the updated item", async () => {
    const db = createMockDb();
    const result = await assignLocation(db, userId, { itemId, locationId });

    expect(result).toEqual(updatedItem);
    expect(db.update).toHaveBeenCalled();
  });

  it("throws when the location does not exist", async () => {
    const db = createMockDb({ selectResults: [[], [{ id: itemId }]] });

    await expect(assignLocation(db, userId, { itemId, locationId: "nonexistent" })).rejects.toThrow(
      "Location not found",
    );
  });

  it("throws when the item does not exist", async () => {
    const db = createMockDb({
      selectResults: [[{ id: locationId }], []],
    });

    await expect(assignLocation(db, userId, { itemId: "nonexistent", locationId })).rejects.toThrow(
      "Item not found",
    );
  });

  it("increments location usage stats", async () => {
    const db = createMockDb();
    await assignLocation(db, userId, { itemId, locationId });

    expect(db.update).toHaveBeenCalledTimes(2);
  });
});
