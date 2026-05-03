import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

const mockCaptureItem = vi.fn();
const mockCountInbox = vi.fn();
const mockAssignLocation = vi.fn();
const mockListInbox = vi.fn();
vi.mock("@/server/services/items", () => ({
  captureItem: (...args: unknown[]) => mockCaptureItem(...args),
  countInbox: (...args: unknown[]) => mockCountInbox(...args),
  listInbox: (...args: unknown[]) => mockListInbox(...args),
  assignLocation: (...args: unknown[]) => mockAssignLocation(...args),
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

describe("items.capture", () => {
  it("throws UNAUTHORIZED when no session", async () => {
    const caller = createCaller(unauthenticatedCtx);
    await expect(
      caller.items.capture({ cloudinaryPublicId: "totaltidy/photo1" }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("calls captureItem service with correct args", async () => {
    const mockItem = {
      id: "item-001",
      userId: "user-123",
      cloudinaryPublicId: "totaltidy/photo1",
      originalImageUrl: "https://res.cloudinary.com/cloud/image/upload/totaltidy/photo1",
      status: "inbox",
    };
    mockCaptureItem.mockResolvedValueOnce(mockItem);

    const caller = createCaller(authenticatedCtx);
    const result = await caller.items.capture({
      cloudinaryPublicId: "totaltidy/photo1",
    });

    expect(result).toEqual(mockItem);
    expect(mockCaptureItem).toHaveBeenCalledWith(expect.anything(), "user-123", {
      cloudinaryPublicId: "totaltidy/photo1",
    });
  });

  it("passes locationId to service when provided", async () => {
    const locationId = "550e8400-e29b-41d4-a716-446655440000";
    mockCaptureItem.mockResolvedValueOnce({ id: "item-002", status: "inbox" });

    const caller = createCaller(authenticatedCtx);
    await caller.items.capture({
      cloudinaryPublicId: "totaltidy/photo2",
      locationId,
    });

    expect(mockCaptureItem).toHaveBeenCalledWith(expect.anything(), "user-123", {
      cloudinaryPublicId: "totaltidy/photo2",
      locationId,
    });
  });

  it("throws NOT_FOUND when service throws Location not found", async () => {
    mockCaptureItem.mockRejectedValueOnce(new Error("Location not found"));

    const caller = createCaller(authenticatedCtx);
    await expect(
      caller.items.capture({
        cloudinaryPublicId: "totaltidy/photo3",
        locationId: "550e8400-e29b-41d4-a716-446655440000",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects empty cloudinaryPublicId", async () => {
    const caller = createCaller(authenticatedCtx);
    await expect(caller.items.capture({ cloudinaryPublicId: "" })).rejects.toThrow();
  });

  it("rejects invalid locationId format", async () => {
    const caller = createCaller(authenticatedCtx);
    await expect(
      caller.items.capture({
        cloudinaryPublicId: "totaltidy/photo4",
        locationId: "not-a-uuid",
      }),
    ).rejects.toThrow();
  });
});

describe("items.inboxCount", () => {
  it("throws UNAUTHORIZED when no session", async () => {
    const caller = createCaller(unauthenticatedCtx);
    await expect(caller.items.inboxCount()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns count from countInbox service", async () => {
    mockCountInbox.mockResolvedValueOnce(7);

    const caller = createCaller(authenticatedCtx);
    const result = await caller.items.inboxCount();

    expect(result).toBe(7);
    expect(mockCountInbox).toHaveBeenCalledWith(expect.anything(), "user-123");
  });

  it("returns 0 when no unassigned items", async () => {
    mockCountInbox.mockResolvedValueOnce(0);

    const caller = createCaller(authenticatedCtx);
    const result = await caller.items.inboxCount();

    expect(result).toBe(0);
  });
});

describe("items.assignLocation", () => {
  const validItemId = "550e8400-e29b-41d4-a716-446655440000";
  const validLocationId = "660e8400-e29b-41d4-a716-446655440000";

  it("throws UNAUTHORIZED when no session", async () => {
    const caller = createCaller(unauthenticatedCtx);
    await expect(
      caller.items.assignLocation({ itemId: validItemId, locationId: validLocationId }),
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("calls assignLocation service with correct args", async () => {
    const mockResult = { id: validItemId, locationId: validLocationId, status: "inbox" };
    mockAssignLocation.mockResolvedValueOnce(mockResult);

    const caller = createCaller(authenticatedCtx);
    const result = await caller.items.assignLocation({
      itemId: validItemId,
      locationId: validLocationId,
    });

    expect(result).toEqual(mockResult);
    expect(mockAssignLocation).toHaveBeenCalledWith(expect.anything(), "user-123", {
      itemId: validItemId,
      locationId: validLocationId,
    });
  });

  it("throws NOT_FOUND when service throws Location not found", async () => {
    mockAssignLocation.mockRejectedValueOnce(new Error("Location not found"));

    const caller = createCaller(authenticatedCtx);
    await expect(
      caller.items.assignLocation({ itemId: validItemId, locationId: validLocationId }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", message: "Location not found" });
  });

  it("throws NOT_FOUND when service throws Item not found", async () => {
    mockAssignLocation.mockRejectedValueOnce(new Error("Item not found"));

    const caller = createCaller(authenticatedCtx);
    await expect(
      caller.items.assignLocation({ itemId: validItemId, locationId: validLocationId }),
    ).rejects.toMatchObject({ code: "NOT_FOUND", message: "Item not found" });
  });

  it("rejects invalid itemId format", async () => {
    const caller = createCaller(authenticatedCtx);
    await expect(
      caller.items.assignLocation({ itemId: "not-a-uuid", locationId: validLocationId }),
    ).rejects.toThrow();
  });

  it("rejects invalid locationId format", async () => {
    const caller = createCaller(authenticatedCtx);
    await expect(
      caller.items.assignLocation({ itemId: validItemId, locationId: "not-a-uuid" }),
    ).rejects.toThrow();
  });
});
