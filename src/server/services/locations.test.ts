import { describe, expect, it, vi } from "vitest";
import { getLastUsedLocation, listLocations, scoreLocation } from "./locations";

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

describe("scoreLocation", () => {
  const now = new Date("2025-06-15T14:00:00Z");

  it("scores a frequently-used, recently-used location highest", () => {
    const score = scoreLocation(
      { useCount: 10, lastUsedAt: new Date("2025-06-15T13:00:00Z") },
      now,
      10,
      0.5,
    );
    // frequency=0.4*1.0, recency=0.4*exp(-1*ln2/24)≈0.4*0.971, timeOfDay=0.2*0.5
    expect(score).toBeGreaterThan(0.75);
  });

  it("scores an unused location at zero", () => {
    const score = scoreLocation({ useCount: 0, lastUsedAt: null }, now, 10, 0);
    expect(score).toBe(0);
  });

  it("recency decays over time", () => {
    const recentScore = scoreLocation(
      { useCount: 5, lastUsedAt: new Date("2025-06-15T13:00:00Z") },
      now,
      10,
      0,
    );
    const staleScore = scoreLocation(
      { useCount: 5, lastUsedAt: new Date("2025-06-10T13:00:00Z") },
      now,
      10,
      0,
    );
    expect(recentScore).toBeGreaterThan(staleScore);
  });

  it("frequency component scales with useCount", () => {
    const highFreq = scoreLocation({ useCount: 10, lastUsedAt: null }, now, 10, 0);
    const lowFreq = scoreLocation({ useCount: 2, lastUsedAt: null }, now, 10, 0);
    expect(highFreq).toBeGreaterThan(lowFreq);
  });

  it("time-of-day ratio boosts the score", () => {
    const withTimeBoost = scoreLocation({ useCount: 5, lastUsedAt: null }, now, 10, 1.0);
    const withoutTimeBoost = scoreLocation({ useCount: 5, lastUsedAt: null }, now, 10, 0);
    expect(withTimeBoost).toBeGreaterThan(withoutTimeBoost);
    expect(withTimeBoost - withoutTimeBoost).toBeCloseTo(0.2);
  });

  it("handles maxUseCount of zero gracefully", () => {
    const score = scoreLocation({ useCount: 0, lastUsedAt: null }, now, 0, 0);
    expect(score).toBe(0);
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
