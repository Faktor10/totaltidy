import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import { createCaller } from "@/server/routers";

describe("appRouter", () => {
  it("healthCheck returns ok status", async () => {
    const caller = createCaller({ headers: new Headers(), session: null });
    const result = await caller.healthCheck();
    expect(result).toEqual({ status: "ok" });
  });

  it("protectedProcedure throws UNAUTHORIZED when no session", async () => {
    const caller = createCaller({ headers: new Headers(), session: null });
    await expect(caller.me()).rejects.toThrow(TRPCError);
    await expect(caller.me()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("protectedProcedure throws UNAUTHORIZED when session has no user id", async () => {
    const caller = createCaller({
      headers: new Headers(),
      session: { user: {}, expires: "" } as never,
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
    });
    const result = await caller.me();
    expect(result).toEqual({ userId: "user-123" });
  });
});
