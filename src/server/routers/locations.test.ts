import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

const mockListLocations = vi.fn();
vi.mock("@/server/services/locations", () => ({
  listLocations: (...args: unknown[]) => mockListLocations(...args),
}));

vi.mock("@/server/db", () => ({
  db: {},
}));

const { createCaller } = await import("@/server/routers");

const authenticatedCtx = {
  headers: new Headers(),
  session: {
    user: { id: "user-123", email: "test@example.com" },
    expires: new Date(Date.now() + 86400000).toISOString(),
  },
  userId: "user-123",
};

const unauthenticatedCtx = {
  headers: new Headers(),
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
