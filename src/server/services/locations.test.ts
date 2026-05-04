import { describe, expect, it, vi } from "vitest";
import { getLastUsedLocation, listLocations } from "./locations";

describe("listLocations", () => {
  const userId = "user-abc-123";

  const mockLocations = [
    {
      id: "loc-001",
      userId,
      name: "Kitchen",
      icon: "🍳",
      sortOrder: 0,
      lastUsedAt: null,
      useCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "loc-002",
      userId,
      name: "Bedroom",
      icon: "🛏️",
      sortOrder: 1,
      lastUsedAt: null,
      useCount: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  function createMockDb(result: unknown[] = mockLocations) {
    return {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(result),
          }),
        }),
      }),
    } as never;
  }

  it("returns locations sorted by sortOrder for the given user", async () => {
    const db = createMockDb();
    const result = await listLocations(db, userId);

    expect(result).toEqual(mockLocations);
    expect(db.select).toHaveBeenCalled();
  });

  it("returns an empty array when user has no locations", async () => {
    const db = createMockDb([]);
    const result = await listLocations(db, userId);

    expect(result).toEqual([]);
  });
});

describe("getLastUsedLocation", () => {
  const userId = "user-abc-123";

  const recentLocation = {
    id: "loc-002",
    userId,
    name: "Bedroom",
    icon: "🛏️",
    sortOrder: 1,
    lastUsedAt: new Date("2025-06-15"),
    useCount: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const firstBySortOrder = {
    id: "loc-001",
    userId,
    name: "Kitchen",
    icon: "🍳",
    sortOrder: 0,
    lastUsedAt: null,
    useCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createMockDb(overrides?: { recencyResult?: unknown[]; sortOrderResult?: unknown[] }) {
    const recencyResult = overrides?.recencyResult ?? [recentLocation];
    const sortOrderResult = overrides?.sortOrderResult ?? [firstBySortOrder];

    let selectCallCount = 0;
    const results = [recencyResult, sortOrderResult];

    return {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockImplementation(() => {
                const result = results[selectCallCount] ?? [];
                selectCallCount++;
                return Promise.resolve(result);
              }),
            }),
          }),
        }),
      }),
    } as never;
  }

  it("returns the most recently used location", async () => {
    const db = createMockDb();
    const result = await getLastUsedLocation(db, userId);

    expect(result).toEqual(recentLocation);
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it("falls back to first by sortOrder when no lastUsedAt", async () => {
    const db = createMockDb({ recencyResult: [firstBySortOrder] });
    const result = await getLastUsedLocation(db, userId);

    expect(result).toEqual(firstBySortOrder);
    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it("returns null when user has no locations", async () => {
    const db = createMockDb({ recencyResult: [], sortOrderResult: [] });
    const result = await getLastUsedLocation(db, userId);

    expect(result).toBeNull();
    expect(db.select).toHaveBeenCalledTimes(2);
  });
});
