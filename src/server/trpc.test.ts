import { TRPCError } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

const { protectedProcedure, publicProcedure, router, createCallerFactory } = await import("./trpc");

const testRouter = router({
  publicRoute: publicProcedure.query(() => "public"),
  protectedRoute: protectedProcedure.query(({ ctx }) => ({
    userId: ctx.userId,
  })),
});

const createCaller = createCallerFactory(testRouter);

describe("protectedProcedure", () => {
  it("throws UNAUTHORIZED when session is null", async () => {
    const caller = createCaller({
      headers: new Headers(),
      session: null,
      userId: null,
    });

    await expect(caller.protectedRoute()).rejects.toThrow(TRPCError);
    await expect(caller.protectedRoute()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("throws UNAUTHORIZED when session has no user id", async () => {
    const caller = createCaller({
      headers: new Headers(),
      session: { user: {}, expires: "" } as never,
      userId: null,
    });

    await expect(caller.protectedRoute()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("allows access and provides userId when authenticated", async () => {
    const caller = createCaller({
      headers: new Headers(),
      session: {
        user: { id: "user-123", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      } as never,
      userId: "user-123",
    });

    const result = await caller.protectedRoute();
    expect(result).toEqual({ userId: "user-123" });
  });

  it("does not block public procedures for unauthenticated users", async () => {
    const caller = createCaller({
      headers: new Headers(),
      session: null,
      userId: null,
    });

    const result = await caller.publicRoute();
    expect(result).toBe("public");
  });
});
