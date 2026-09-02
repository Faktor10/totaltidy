import { describe, expect, it, vi } from "vitest";

const mockListLocations = vi.fn();
vi.mock("../services/locations", () => ({
  listLocations: (...args: unknown[]) => mockListLocations(...args),
}));

vi.mock("@totaltidy/db", () => ({
  db: {},
}));

const { createCaller } = await import("./index");

const authenticatedCtx = {
  db: {} as never,
  session: {
    user: { id: "user-123", email: "test@example.com", name: null, image: null },
    expires: new Date(Date.now() + 86400000),
  },
  userId: "user-123",
};

const unauthenticatedCtx = {
  db: {} as never,
  session: null,
  userId: null,
};

describe("locations.list", () => {
  it("throws UNAUTHORIZED when no session", async () => {
    const caller = createCaller(unauthenticatedCtx);
    await expect(caller.locations.list()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("returns locations from the service", async () => {
    const mockLocations = [
      { id: "loc-001", name: "Kitchen", sortOrder: 0 },
      { id: "loc-002", name: "Bedroom", sortOrder: 1 },
    ];
    mockListLocations.mockResolvedValueOnce(mockLocations);

    const caller = createCaller(authenticatedCtx);
    const result = await caller.locations.list();

    expect(result).toEqual(mockLocations);
    expect(mockListLocations).toHaveBeenCalledWith(expect.anything(), "user-123");
  });

  it("returns empty array when user has no locations", async () => {
    mockListLocations.mockResolvedValueOnce([]);

    const caller = createCaller(authenticatedCtx);
    const result = await caller.locations.list();

    expect(result).toEqual([]);
  });
});
