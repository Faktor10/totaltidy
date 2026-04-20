import { describe, expect, it } from "vitest";
import {
  captureSessionsForUser,
  inboxItems,
  itemsForUser,
  locationsForUser,
  unsortedItems,
  userScope,
} from "./helpers";
import { captureSessions, items, locations } from "./schema";

describe("userScope", () => {
  it("returns a SQL expression for a valid userId", () => {
    const result = userScope(items.userId, "user-123");
    expect(result).toBeDefined();
  });

  it("throws when userId is empty string", () => {
    expect(() => userScope(items.userId, "")).toThrow("userId is required for user-scoped queries");
  });

  it("works with different table columns", () => {
    const itemsFilter = userScope(items.userId, "u1");
    const locationsFilter = userScope(locations.userId, "u1");
    const sessionsFilter = userScope(captureSessions.userId, "u1");

    expect(itemsFilter).toBeDefined();
    expect(locationsFilter).toBeDefined();
    expect(sessionsFilter).toBeDefined();
  });
});

describe("itemsForUser", () => {
  it("returns a SQL expression", () => {
    const result = itemsForUser("user-abc");
    expect(result).toBeDefined();
  });

  it("throws for empty userId", () => {
    expect(() => itemsForUser("")).toThrow("userId is required");
  });
});

describe("locationsForUser", () => {
  it("returns a SQL expression", () => {
    const result = locationsForUser("user-abc");
    expect(result).toBeDefined();
  });

  it("throws for empty userId", () => {
    expect(() => locationsForUser("")).toThrow("userId is required");
  });
});

describe("captureSessionsForUser", () => {
  it("returns a SQL expression", () => {
    const result = captureSessionsForUser("user-abc");
    expect(result).toBeDefined();
  });

  it("throws for empty userId", () => {
    expect(() => captureSessionsForUser("")).toThrow("userId is required");
  });
});

describe("inboxItems", () => {
  it("returns a compound SQL expression", () => {
    const result = inboxItems("user-abc");
    expect(result).toBeDefined();
  });

  it("throws for empty userId", () => {
    expect(() => inboxItems("")).toThrow("userId is required");
  });
});

describe("unsortedItems", () => {
  it("returns a compound SQL expression", () => {
    const result = unsortedItems("user-abc");
    expect(result).toBeDefined();
  });

  it("throws for empty userId", () => {
    expect(() => unsortedItems("")).toThrow("userId is required");
  });
});
