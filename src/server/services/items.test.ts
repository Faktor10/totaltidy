import { describe, expect, it, vi } from "vitest";
import { assignLocation, buildCloudinaryUrl, captureItem, countInbox, listInbox } from "./items";

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

describe("countInbox", () => {
  const userId = "user-abc-123";

  function createMockDb(countResult: number) {
    return {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: countResult }]),
        }),
      }),
    } as never;
  }

  it("returns the count of unassigned items", async () => {
    const db = createMockDb(5);
    const result = await countInbox(db, userId);

    expect(result).toBe(5);
    expect(db.select).toHaveBeenCalled();
  });

  it("returns 0 when no unassigned items exist", async () => {
    const db = createMockDb(0);
    const result = await countInbox(db, userId);

    expect(result).toBe(0);
  });

  it("returns 0 when query returns empty array", async () => {
    const db = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as never;

    const result = await countInbox(db, userId);
    expect(result).toBe(0);
  });
});

describe("listInbox", () => {
  const userId = "user-abc-123";
  const inboxItems = [
    {
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
      createdAt: new Date("2025-01-02"),
      updatedAt: new Date("2025-01-02"),
    },
    {
      id: "item-002",
      userId,
      cloudinaryPublicId: "totaltidy/photo2",
      originalImageUrl: "https://res.cloudinary.com/test-cloud/image/upload/totaltidy/photo2",
      processedImageUrl: null,
      locationId: null,
      captureSessionId: null,
      label: "Toy car",
      tags: null,
      category: null,
      status: "inbox" as const,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
  ];

  function createMockDb(selectResult: unknown[] = inboxItems) {
    return {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(selectResult),
          }),
        }),
      }),
    } as never;
  }

  it("returns items with no location assigned", async () => {
    const db = createMockDb();
    const result = await listInbox(db, userId);

    expect(result).toEqual(inboxItems);
    expect(result).toHaveLength(2);
    expect(db.select).toHaveBeenCalled();
  });

  it("returns empty array when no unsorted items exist", async () => {
    const db = createMockDb([]);
    const result = await listInbox(db, userId);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it("calls select with correct chain", async () => {
    const db = createMockDb();
    await listInbox(db, userId);

    expect(db.select).toHaveBeenCalled();
  });
});

describe("assignLocation", () => {
  const userId = "user-abc-123";
  const itemId = "item-001";
  const locationId = "loc-001";
  const updatedItem = {
    id: itemId,
    userId,
    cloudinaryPublicId: "totaltidy/photo1",
    originalImageUrl: "https://res.cloudinary.com/test-cloud/image/upload/totaltidy/photo1",
    processedImageUrl: null,
    locationId,
    captureSessionId: null,
    label: null,
    tags: null,
    category: null,
    status: "inbox" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createMockDb(overrides?: {
    locationSelectResult?: unknown[];
    itemSelectResult?: unknown[];
    updateResult?: unknown[];
  }) {
    const locationSelectResult = overrides?.locationSelectResult ?? [{ id: locationId }];
    const itemSelectResult = overrides?.itemSelectResult ?? [{ id: itemId }];
    const updateResult = overrides?.updateResult ?? [updatedItem];

    let selectCallCount = 0;
    const selectResults = [locationSelectResult, itemSelectResult];

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
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue(updateResult),
          }),
        }),
      }),
    } as never;
  }

  it("assigns a location to an existing item", async () => {
    const db = createMockDb();
    const result = await assignLocation(db, userId, { itemId, locationId });

    expect(result).toEqual(updatedItem);
    expect(db.update).toHaveBeenCalled();
  });

  it("throws when location does not belong to user", async () => {
    const db = createMockDb({ locationSelectResult: [] });

    await expect(assignLocation(db, userId, { itemId, locationId })).rejects.toThrow(
      "Location not found",
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it("throws when item does not belong to user", async () => {
    const db = createMockDb({ itemSelectResult: [] });

    await expect(assignLocation(db, userId, { itemId, locationId })).rejects.toThrow(
      "Item not found",
    );
    expect(db.update).not.toHaveBeenCalled();
  });

  it("validates location before checking item", async () => {
    const db = createMockDb({ locationSelectResult: [] });

    await expect(assignLocation(db, userId, { itemId, locationId })).rejects.toThrow(
      "Location not found",
    );
    expect(db.select).toHaveBeenCalledTimes(1);
  });
});
