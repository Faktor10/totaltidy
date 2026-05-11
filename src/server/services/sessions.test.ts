import { beforeEach, describe, expect, it, vi } from "vitest";
import { endSession, getSession, startSession } from "./sessions";

describe("startSession", () => {
  const userId = "user-abc-123";
  const mockSession = {
    id: "session-001",
    userId,
    startedAt: new Date(),
    endedAt: null,
    itemCount: 0,
    summary: null,
  };

  function createMockDb(insertResult: unknown[] = [mockSession]) {
    return {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(insertResult),
        }),
      }),
    } as never;
  }

  it("creates a new session for the user", async () => {
    const db = createMockDb();
    const result = await startSession(db, userId);

    expect(result).toEqual(mockSession);
    expect(db.insert).toHaveBeenCalled();
  });

  it("returns session with null endedAt", async () => {
    const db = createMockDb();
    const result = await startSession(db, userId);

    expect(result.endedAt).toBeNull();
  });

  it("returns session with itemCount 0", async () => {
    const db = createMockDb();
    const result = await startSession(db, userId);

    expect(result.itemCount).toBe(0);
  });
});

describe("endSession", () => {
  const userId = "user-abc-123";
  const sessionId = "session-001";
  const startedAt = new Date("2025-01-01T10:00:00Z");

  beforeEach(() => {
    vi.useRealTimers();
  });

  function createMockDb(overrides?: { selectResults?: unknown[][]; updateResult?: unknown[] }) {
    const existingSession = [{ id: sessionId, startedAt }];
    const itemCount = [{ count: 3 }];
    const locationCount = [{ count: 2 }];
    const unsortedCount = [{ count: 1 }];

    const selectResults = overrides?.selectResults ?? [
      existingSession,
      itemCount,
      locationCount,
      unsortedCount,
    ];

    const updatedSession = {
      id: sessionId,
      userId,
      startedAt,
      endedAt: new Date(),
      itemCount: 3,
      summary: {
        itemsCaptured: 3,
        locationsUsed: 2,
        unsortedItems: 1,
        durationMs: expect.any(Number),
      },
    };
    const updateResult = overrides?.updateResult ?? [updatedSession];

    let selectCallCount = 0;

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

  it("ends an existing session and returns it", async () => {
    const db = createMockDb();
    const result = await endSession(db, userId, sessionId);

    expect(result).toBeDefined();
    expect(db.update).toHaveBeenCalled();
  });

  it("throws when session does not belong to user", async () => {
    const db = createMockDb({ selectResults: [[]] });

    await expect(endSession(db, userId, sessionId)).rejects.toThrow("Session not found");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("counts items linked to the session", async () => {
    const db = createMockDb();
    await endSession(db, userId, sessionId);

    expect(db.select).toHaveBeenCalledTimes(4);
  });

  it("sets endedAt and itemCount on the session", async () => {
    const setSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: sessionId }]),
      }),
    });

    let selectCallCount = 0;
    const selectResults = [
      [{ id: sessionId, startedAt }],
      [{ count: 5 }],
      [{ count: 3 }],
      [{ count: 2 }],
    ];

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
    } as never;

    await endSession(db, userId, sessionId);

    const setArg = setSpy.mock.calls[0][0];
    expect(setArg.endedAt).toBeInstanceOf(Date);
    expect(setArg.itemCount).toBe(5);
    expect(setArg.summary).toEqual({
      itemsCaptured: 5,
      locationsUsed: 3,
      unsortedItems: 2,
      durationMs: expect.any(Number),
    });
  });

  it("computes duration from startedAt to endedAt", async () => {
    const setSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: sessionId }]),
      }),
    });

    let selectCallCount = 0;
    const recentStart = new Date(Date.now() - 5000);
    const selectResults = [
      [{ id: sessionId, startedAt: recentStart }],
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
    ];

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
    } as never;

    await endSession(db, userId, sessionId);

    const setArg = setSpy.mock.calls[0][0];
    expect(setArg.summary.durationMs).toBeGreaterThanOrEqual(5000);
    expect(setArg.summary.durationMs).toBeLessThan(10000);
  });

  it("handles session with zero items", async () => {
    const setSpy = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: sessionId }]),
      }),
    });

    let selectCallCount = 0;
    const selectResults = [
      [{ id: sessionId, startedAt }],
      [{ count: 0 }],
      [{ count: 0 }],
      [{ count: 0 }],
    ];

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
    } as never;

    await endSession(db, userId, sessionId);

    const setArg = setSpy.mock.calls[0][0];
    expect(setArg.itemCount).toBe(0);
    expect(setArg.summary.itemsCaptured).toBe(0);
    expect(setArg.summary.locationsUsed).toBe(0);
    expect(setArg.summary.unsortedItems).toBe(0);
  });
});

describe("getSession", () => {
  const userId = "user-abc-123";
  const sessionId = "session-001";

  const mockSession = {
    id: sessionId,
    userId,
    startedAt: new Date(),
    endedAt: null,
    itemCount: 0,
    summary: null,
  };

  function createMockDb(selectResult: unknown[] = [mockSession]) {
    return {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(selectResult),
        }),
      }),
    } as never;
  }

  it("returns a session by id", async () => {
    const db = createMockDb();
    const result = await getSession(db, userId, sessionId);

    expect(result).toEqual(mockSession);
    expect(db.select).toHaveBeenCalled();
  });

  it("returns null when session does not exist", async () => {
    const db = createMockDb([]);
    const result = await getSession(db, userId, sessionId);

    expect(result).toBeNull();
  });

  it("returns null when session belongs to different user", async () => {
    const db = createMockDb([]);
    const result = await getSession(db, "other-user-id", sessionId);

    expect(result).toBeNull();
  });
});
