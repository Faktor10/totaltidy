import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@totaltidy/db", () => ({
  db: {},
}));

const { createCaller } = await import("./index");

describe("appRouter", () => {
  it("healthCheck returns ok status", async () => {
    const caller = createCaller({
      db: {} as never,
      session: null,
      userId: null,
    });
    const result = await caller.healthCheck();
    expect(result).toEqual({ status: "ok" });
  });

  it("protectedProcedure throws UNAUTHORIZED when no session", async () => {
    const caller = createCaller({ db: {} as never, session: null, userId: null });
    await expect(caller.me()).rejects.toThrow(TRPCError);
    await expect(caller.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("protectedProcedure throws UNAUTHORIZED when session has no user id", async () => {
    const caller = createCaller({
      db: {} as never,
      session: { user: {}, expires: "" } as never,
      userId: null,
    });
    await expect(caller.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("protectedProcedure succeeds with valid session", async () => {
    const caller = createCaller({
      db: {} as never,
      session: {
        user: { id: "user-123", email: "test@example.com", name: null, image: null },
        expires: new Date(Date.now() + 86400000),
      },
      userId: "user-123",
    });
    const result = await caller.me();
    expect(result).toEqual({
      userId: "user-123",
      user: { id: "user-123", email: "test@example.com", name: null, image: null },
    });
  });
});
