import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

const mockStartSession = vi.fn();
const mockEndSession = vi.fn();
const mockGetSession = vi.fn();
vi.mock("@/server/services/sessions", () => ({
  startSession: (...args: unknown[]) => mockStartSession(...args),
  endSession: (...args: unknown[]) => mockEndSession(...args),
  getSession: (...args: unknown[]) => mockGetSession(...args),
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

describe("sessions.startSession", () => {
  it("throws UNAUTHORIZED when no session", async () => {
    const caller = createCaller(unauthenticatedCtx);
    await expect(caller.sessions.startSession()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates a new session", async () => {
    const mockResult = {
      id: "session-001",
      userId: "user-123",
      startedAt: new Date(),
      endedAt: null,
      itemCount: 0,
      summary: null,
    };
    mockStartSession.mockResolvedValueOnce(mockResult);

    const caller = createCaller(authenticatedCtx);
    const result = await caller.sessions.startSession();

    expect(result).toEqual(mockResult);
    expect(mockStartSession).toHaveBeenCalledWith(expect.anything(), "user-123");
  });
});

describe("sessions.endSession", () => {
  const validSessionId = "550e8400-e29b-41d4-a716-446655440000";

  it("throws UNAUTHORIZED when no session", async () => {
    const caller = createCaller(unauthenticatedCtx);
    await expect(caller.sessions.endSession({ sessionId: validSessionId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("calls endSession service with correct args", async () => {
    const mockResult = {
      id: validSessionId,
      userId: "user-123",
      startedAt: new Date(),
      endedAt: new Date(),
      itemCount: 5,
      summary: { itemsCaptured: 5, locationsUsed: 2, unsortedItems: 1, durationMs: 30000 },
    };
    mockEndSession.mockResolvedValueOnce(mockResult);

    const caller = createCaller(authenticatedCtx);
    const result = await caller.sessions.endSession({ sessionId: validSessionId });

    expect(result).toEqual(mockResult);
    expect(mockEndSession).toHaveBeenCalledWith(expect.anything(), "user-123", validSessionId);
  });

  it("throws NOT_FOUND when service throws Session not found", async () => {
    mockEndSession.mockRejectedValueOnce(new Error("Session not found"));

    const caller = createCaller(authenticatedCtx);
    await expect(caller.sessions.endSession({ sessionId: validSessionId })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Session not found",
    });
  });

  it("rejects invalid sessionId format", async () => {
    const caller = createCaller(authenticatedCtx);
    await expect(caller.sessions.endSession({ sessionId: "not-a-uuid" })).rejects.toThrow();
  });
});

describe("sessions.get", () => {
  const validSessionId = "550e8400-e29b-41d4-a716-446655440000";

  it("throws UNAUTHORIZED when no session", async () => {
    const caller = createCaller(unauthenticatedCtx);
    await expect(caller.sessions.get({ sessionId: validSessionId })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("returns session by id", async () => {
    const mockResult = {
      id: validSessionId,
      userId: "user-123",
      startedAt: new Date(),
      endedAt: null,
      itemCount: 0,
      summary: null,
    };
    mockGetSession.mockResolvedValueOnce(mockResult);

    const caller = createCaller(authenticatedCtx);
    const result = await caller.sessions.get({ sessionId: validSessionId });

    expect(result).toEqual(mockResult);
    expect(mockGetSession).toHaveBeenCalledWith(expect.anything(), "user-123", validSessionId);
  });

  it("throws NOT_FOUND when session does not exist", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const caller = createCaller(authenticatedCtx);
    await expect(caller.sessions.get({ sessionId: validSessionId })).rejects.toMatchObject({
      code: "NOT_FOUND",
      message: "Session not found",
    });
  });

  it("rejects invalid sessionId format", async () => {
    const caller = createCaller(authenticatedCtx);
    await expect(caller.sessions.get({ sessionId: "not-a-uuid" })).rejects.toThrow();
  });
});
