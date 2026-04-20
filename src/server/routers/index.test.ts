import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
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
});
