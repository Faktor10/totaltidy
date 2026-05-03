import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/server/db", () => ({
  db: {},
}));

const { createCaller } = await import("@/server/routers");

describe("appRouter", () => {
  it("healthCheck returns ok status", async () => {
    const caller = createCaller({
      headers: new Headers(),
      session: null,
      userId: null,
    });
    const result = await caller.healthCheck();
    expect(result).toEqual({ status: "ok" });
  });

  it("protectedProcedure throws UNAUTHORIZED when no session", async () => {
    const caller = createCaller({ headers: new Headers(), session: null, userId: null });
    await expect(caller.me()).rejects.toThrow(TRPCError);
    await expect(caller.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("protectedProcedure throws UNAUTHORIZED when session has no user id", async () => {
    const caller = createCaller({
      headers: new Headers(),
      session: { user: {}, expires: "" } as never,
      userId: null,
    });
    await expect(caller.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("protectedProcedure succeeds with valid session", async () => {
    const caller = createCaller({
      headers: new Headers(),
      session: {
        user: { id: "user-123", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
      userId: "user-123",
    });
    const result = await caller.me();
    expect(result).toEqual({ userId: "user-123" });
  });
});
