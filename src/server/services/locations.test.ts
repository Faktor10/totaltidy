import { describe, expect, it, vi } from "vitest";
import { listLocations } from "./locations";

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
