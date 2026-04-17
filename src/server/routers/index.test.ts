import { describe, expect, it } from "vitest";
import { createCaller } from "@/server/routers";

describe("appRouter", () => {
  it("healthCheck returns ok status", async () => {
    const caller = createCaller({ headers: new Headers() });
    const result = await caller.healthCheck();
    expect(result).toEqual({ status: "ok" });
  });
});
