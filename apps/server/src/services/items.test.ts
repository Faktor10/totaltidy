import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MockDatabase } from "./__fixtures__/mock-db";
import {
  assignLocation,
  batchAssignLocation,
  buildCloudinaryUrl,
  captureItem,
  countInbox,
  listInbox,
  listItems,
} from "./items";

const mockGetLastUsedLocation = vi.fn();
vi.mock("./locations", () => ({
  getLastUsedLocation: (...args: unknown[]) => mockGetLastUsedLocation(...args),
}));

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
  beforeEach(() => {
    mockGetLastUsedLocation.mockClear();
  });

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
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    } as unknown as MockDatabase;
  }

  it("creates an item with status inbox and no location when no last-used location exists", async () => {
    mockGetLastUsedLocation.mockResolvedValueOnce(null);
    const db = createMockDb();
    const result = await captureItem(db, userId, {
      cloudinaryPublicId: "totaltidy/photo1",
    });

    expect(result).toEqual(mockItem);
    expect(db.insert).toHaveBeenCalled();
    expect(mockGetLastUsedLocation).toHaveBeenCalledWith(db, userId);
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

  it("updates location lastUsedAt and useCount when locationId is provided", async () => {
    const locationId = "loc-001";
    const itemWithLocation = { ...mockItem, locationId };
    const db = createMockDb({
      selectResult: [{ id: locationId }],
      insertResult: [itemWithLocation],
    });

    await captureItem(db, userId, {
      cloudinaryPublicId: "totaltidy/photo1",
      locationId,
    });

    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("does not update location stats when no locationId provided and no last-used location", async () => {
    mockGetLastUsedLocation.mockResolvedValueOnce(null);
    const db = createMockDb();
    await captureItem(db, userId, {
      cloudinaryPublicId: "totaltidy/photo1",
    });

    expect(db.update).not.toHaveBeenCalled();
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

  it("does not query locations table directly when locationId is not provided", async () => {
    mockGetLastUsedLocation.mockResolvedValueOnce(null);
    const db = createMockDb();
    await captureItem(db, userId, {
      cloudinaryPublicId: "totaltidy/photo1",
    });

    expect(db.select).not.toHaveBeenCalled();
  });

  it("defaults to last-used location when no locationId provided", async () => {
    const lastLocationId = "loc-last-used";
    mockGetLastUsedLocation.mockResolvedValueOnce({
      id: lastLocationId,
      userId,
      name: "Kitchen",
      icon: null,
      sortOrder: 0,
      lastUsedAt: new Date(),
      useCount: 5,
    });
    const itemWithLastLocation = { ...mockItem, locationId: lastLocationId };
    const db = createMockDb({ insertResult: [itemWithLastLocation] });

    const result = await captureItem(db, userId, {
      cloudinaryPublicId: "totaltidy/photo1",
    });

    expect(result).toEqual(itemWithLastLocation);
    expect(mockGetLastUsedLocation).toHaveBeenCalledWith(db, userId);
    expect(db.update).toHaveBeenCalledTimes(1);
  });

  it("uses explicit locationId over last-used location", async () => {
    const locationId = "loc-001";
    const itemWithLocation = { ...mockItem, locationId };
    const db = createMockDb({
      selectResult: [{ id: locationId }],
      insertResult: [itemWithLocation],
    });

    await captureItem(db, userId, {
      cloudinaryPublicId: "totaltidy/photo1",
      locationId,
    });

    expect(mockGetLastUsedLocation).not.toHaveBeenCalled();
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
    } as unknown as MockDatabase;
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
    } as unknown as MockDatabase;

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
    } as unknown as MockDatabase;
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

describe("listItems", () => {
  const userId = "user-abc-123";
  const allItems = [
    {
      id: "item-001",
      userId,
      cloudinaryPublicId: "totaltidy/photo1",
      originalImageUrl: "https://res.cloudinary.com/test-cloud/image/upload/totaltidy/photo1",
      processedImageUrl:
        "https://res.cloudinary.com/test-cloud/image/upload/e_background_removal/totaltidy/photo1",
      locationId: "loc-001",
      captureSessionId: null,
      label: "Toy car",
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
      label: null,
      tags: null,
      category: null,
      status: "inbox" as const,
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    },
  ];

  function createMockDb(selectResult: unknown[] = allItems) {
    return {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(selectResult),
          }),
        }),
      }),
    } as unknown as MockDatabase;
  }

  it("returns all items for the user", async () => {
    const db = createMockDb();
    const result = await listItems(db, userId);

    expect(result).toEqual(allItems);
    expect(result).toHaveLength(2);
    expect(db.select).toHaveBeenCalled();
  });

  it("includes items with and without processed images", async () => {
    const db = createMockDb();
    const result = await listItems(db, userId);

    expect(result[0].processedImageUrl).not.toBeNull();
    expect(result[1].processedImageUrl).toBeNull();
  });

  it("returns empty array when user has no items", async () => {
    const db = createMockDb([]);
    const result = await listItems(db, userId);

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
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
    } as unknown as MockDatabase;
  }

  it("assigns a location to an existing item", async () => {
    const db = createMockDb();
    const result = await assignLocation(db, userId, { itemId, locationId });

    expect(result).toEqual(updatedItem);
    expect(db.update).toHaveBeenCalled();
  });

  it("persists lastUsedAt and useCount on location after assignment", async () => {
    const db = createMockDb();
    await assignLocation(db, userId, { itemId, locationId });

    expect(db.update).toHaveBeenCalledTimes(2);
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

  it("persists lastUsedAt and useCount after assigning location", async () => {
    let updateCallCount = 0;
    const setSpy = vi.fn().mockImplementation(() => {
      updateCallCount++;
      if (updateCallCount === 1) {
        return {
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedItem]),
          }),
        };
      }
      return {
        where: vi.fn().mockResolvedValue(undefined),
      };
    });

    let selectCallCount = 0;
    const selectResults = [[{ id: locationId }], [{ id: itemId }]];

    const db = {
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
        set: setSpy,
      }),
    } as unknown as MockDatabase;

    await assignLocation(db, userId, { itemId, locationId });

    expect(db.update).toHaveBeenCalledTimes(2);
    const locationStatsArg = setSpy.mock.calls[1][0];
    expect(locationStatsArg.lastUsedAt).toBeInstanceOf(Date);
    expect(locationStatsArg.useCount).toBeDefined();
  });
});

describe("batchAssignLocation", () => {
  const userId = "user-abc-123";
  const locationId = "loc-001";

  function createMockDb(overrides?: {
    locationSelectResult?: unknown[];
    inboxSelectResult?: unknown[];
  }) {
    const locationSelectResult = overrides?.locationSelectResult ?? [{ id: locationId }];
    const inboxSelectResult = overrides?.inboxSelectResult ?? [
      { id: "item-001" },
      { id: "item-002" },
      { id: "item-003" },
    ];

    let selectCallCount = 0;
    const selectResults = [locationSelectResult, inboxSelectResult];

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
          where: vi.fn().mockResolvedValue(undefined),
        }),
      }),
    } as unknown as MockDatabase;
  }

  it("assigns all inbox items to the given location", async () => {
    const db = createMockDb();
    const result = await batchAssignLocation(db, userId, locationId);

    expect(result).toEqual({ count: 3 });
    expect(db.update).toHaveBeenCalledTimes(2);
  });

  it("returns count 0 when inbox is empty", async () => {
    const db = createMockDb({ inboxSelectResult: [] });
    const result = await batchAssignLocation(db, userId, locationId);

    expect(result).toEqual({ count: 0 });
    expect(db.update).not.toHaveBeenCalled();
  });

  it("throws when location does not belong to user", async () => {
    const db = createMockDb({ locationSelectResult: [] });

    await expect(batchAssignLocation(db, userId, locationId)).rejects.toThrow("Location not found");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("persists lastUsedAt and useCount on location after batch assignment", async () => {
    const db = createMockDb();
    await batchAssignLocation(db, userId, locationId);

    expect(db.update).toHaveBeenCalledTimes(2);
  });

  it("handles a single inbox item", async () => {
    const db = createMockDb({ inboxSelectResult: [{ id: "item-solo" }] });
    const result = await batchAssignLocation(db, userId, locationId);

    expect(result).toEqual({ count: 1 });
    expect(db.update).toHaveBeenCalledTimes(2);
  });

  it("persists lastUsedAt and useCount with batch item count", async () => {
    const inboxItems = [{ id: "item-001" }, { id: "item-002" }, { id: "item-003" }];
    const setSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    });

    let selectCallCount = 0;
    const selectResults = [[{ id: locationId }], inboxItems];

    const db = {
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
        set: setSpy,
      }),
    } as unknown as MockDatabase;

    await batchAssignLocation(db, userId, locationId);

    expect(db.update).toHaveBeenCalledTimes(2);
    const locationStatsArg = setSpy.mock.calls[1][0];
    expect(locationStatsArg.lastUsedAt).toBeInstanceOf(Date);
    expect(locationStatsArg.useCount).toBeDefined();
  });
});
