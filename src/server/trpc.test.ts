import { TRPCError } from "@trpc/server";
import { describe, expect, it } from "vitest";
import {
  createCallerFactory,
  createTRPCContext,
  protectedProcedure,
  publicProcedure,
  router,
} from "./trpc";

describe("createTRPCContext", () => {
  it("returns context with session and headers", () => {
    const headers = new Headers({ "x-custom": "value" });
    const session = {
      user: { id: "user-1", email: "a@b.com" },
      expires: new Date(Date.now() + 86400000).toISOString(),
    };
    const ctx = createTRPCContext({ headers, session });
    expect(ctx.session).toBe(session);
    expect(ctx.headers).toBe(headers);
  });

  it("accepts null session for unauthenticated requests", () => {
    const ctx = createTRPCContext({ headers: new Headers(), session: null });
    expect(ctx.session).toBeNull();
  });

  it("preserves all header values", () => {
    const headers = new Headers({
      authorization: "Bearer token-xyz",
      "content-type": "application/json",
    });
    const ctx = createTRPCContext({ headers, session: null });
    expect(ctx.headers.get("authorization")).toBe("Bearer token-xyz");
    expect(ctx.headers.get("content-type")).toBe("application/json");
  });
});

const testRouter = router({
  publicEndpoint: publicProcedure.query(() => {
    return { open: true };
  }),

  protectedEndpoint: protectedProcedure.query(({ ctx }) => {
    return { userId: ctx.session.user.id };
  }),

  protectedMutation: protectedProcedure.mutation(({ ctx }) => {
    return { mutatedBy: ctx.session.user.id };
  }),
});

const createTestCaller = createCallerFactory(testRouter);

describe("enforceAuth middleware", () => {
  it("blocks access when session is null", async () => {
    const caller = createTestCaller({ headers: new Headers(), session: null });
    await expect(caller.protectedEndpoint()).rejects.toThrow(TRPCError);
    await expect(caller.protectedEndpoint()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("blocks access when session has no user property", async () => {
    const caller = createTestCaller({
      headers: new Headers(),
      session: { expires: "" } as never,
    });
    await expect(caller.protectedEndpoint()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("blocks access when session.user has no id", async () => {
    const caller = createTestCaller({
      headers: new Headers(),
      session: { user: { email: "a@b.com" }, expires: "" } as never,
    });
    await expect(caller.protectedEndpoint()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("blocks access when session.user.id is empty string", async () => {
    const caller = createTestCaller({
      headers: new Headers(),
      session: { user: { id: "" }, expires: "" } as never,
    });
    await expect(caller.protectedEndpoint()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("allows access with valid session and returns narrowed userId", async () => {
    const caller = createTestCaller({
      headers: new Headers(),
      session: {
        user: { id: "user-abc", email: "test@example.com" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    const result = await caller.protectedEndpoint();
    expect(result).toEqual({ userId: "user-abc" });
  });

  it("protects mutations the same as queries", async () => {
    const unauthCaller = createTestCaller({ headers: new Headers(), session: null });
    await expect(unauthCaller.protectedMutation()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    const authCaller = createTestCaller({
      headers: new Headers(),
      session: {
        user: { id: "user-mut" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    const result = await authCaller.protectedMutation();
    expect(result).toEqual({ mutatedBy: "user-mut" });
  });
});

describe("publicProcedure", () => {
  it("allows access without any session", async () => {
    const caller = createTestCaller({ headers: new Headers(), session: null });
    const result = await caller.publicEndpoint();
    expect(result).toEqual({ open: true });
  });

  it("allows access with a valid session", async () => {
    const caller = createTestCaller({
      headers: new Headers(),
      session: {
        user: { id: "user-123" },
        expires: new Date(Date.now() + 86400000).toISOString(),
      },
    });
    const result = await caller.publicEndpoint();
    expect(result).toEqual({ open: true });
  });
});
