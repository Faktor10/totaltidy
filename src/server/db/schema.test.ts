import { getTableColumns, getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  type CaptureSession,
  captureSessions,
  type Item,
  items,
  type Location,
  locations,
  type NewCaptureSession,
  type NewItem,
  type NewLocation,
  type NewUser,
  type User,
  users,
} from "./schema";

describe("users table", () => {
  it("has the correct table name", () => {
    expect(getTableName(users)).toBe("users");
  });

  it("has all expected columns", () => {
    const columns = getTableColumns(users);
    const columnNames = Object.keys(columns);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("name");
    expect(columnNames).toContain("email");
    expect(columnNames).toContain("emailVerified");
    expect(columnNames).toContain("image");
    expect(columnNames).toContain("createdAt");
    expect(columnNames).toContain("updatedAt");
  });

  it("has email as a non-nullable column", () => {
    const columns = getTableColumns(users);
    expect(columns.email.notNull).toBe(true);
  });

  it("has name as a nullable column", () => {
    const columns = getTableColumns(users);
    expect(columns.name.notNull).toBe(false);
  });

  it("exports correct inferred types", () => {
    const user: User = {
      id: "uuid",
      name: "Test",
      email: "test@test.com",
      emailVerified: new Date(),
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(user.email).toBe("test@test.com");

    const newUser: NewUser = { email: "new@test.com" };
    expect(newUser.email).toBe("new@test.com");
  });
});

describe("items table", () => {
  it("has the correct table name", () => {
    expect(getTableName(items)).toBe("items");
  });

  it("has all expected columns", () => {
    const columns = getTableColumns(items);
    const columnNames = Object.keys(columns);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("userId");
    expect(columnNames).toContain("locationId");
    expect(columnNames).toContain("captureSessionId");
    expect(columnNames).toContain("cloudinaryPublicId");
    expect(columnNames).toContain("originalImageUrl");
    expect(columnNames).toContain("processedImageUrl");
    expect(columnNames).toContain("label");
    expect(columnNames).toContain("tags");
    expect(columnNames).toContain("category");
    expect(columnNames).toContain("status");
    expect(columnNames).toContain("createdAt");
    expect(columnNames).toContain("updatedAt");
  });

  it("has userId as non-nullable", () => {
    const columns = getTableColumns(items);
    expect(columns.userId.notNull).toBe(true);
  });

  it("has locationId as nullable (items can be unsorted)", () => {
    const columns = getTableColumns(items);
    expect(columns.locationId.notNull).toBe(false);
  });

  it("has processedImageUrl as nullable (async background removal)", () => {
    const columns = getTableColumns(items);
    expect(columns.processedImageUrl.notNull).toBe(false);
  });

  it("has label as nullable (async AI tagging)", () => {
    const columns = getTableColumns(items);
    expect(columns.label.notNull).toBe(false);
  });

  it("has status as non-nullable with default", () => {
    const columns = getTableColumns(items);
    expect(columns.status.notNull).toBe(true);
    expect(columns.status.hasDefault).toBe(true);
  });

  it("exports correct inferred types", () => {
    const item: Item = {
      id: "uuid",
      userId: "user-uuid",
      locationId: null,
      captureSessionId: null,
      cloudinaryPublicId: "totaltidy/abc123",
      originalImageUrl: "https://res.cloudinary.com/demo/image/upload/abc123",
      processedImageUrl: null,
      label: null,
      tags: null,
      category: null,
      status: "inbox",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(item.status).toBe("inbox");

    const newItem: NewItem = {
      userId: "user-uuid",
      cloudinaryPublicId: "totaltidy/abc123",
      originalImageUrl: "https://res.cloudinary.com/demo/image/upload/abc123",
    };
    expect(newItem.userId).toBe("user-uuid");
  });
});

describe("locations table", () => {
  it("has the correct table name", () => {
    expect(getTableName(locations)).toBe("locations");
  });

  it("has all expected columns", () => {
    const columns = getTableColumns(locations);
    const columnNames = Object.keys(columns);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("userId");
    expect(columnNames).toContain("name");
    expect(columnNames).toContain("icon");
    expect(columnNames).toContain("sortOrder");
    expect(columnNames).toContain("lastUsedAt");
    expect(columnNames).toContain("useCount");
    expect(columnNames).toContain("createdAt");
    expect(columnNames).toContain("updatedAt");
  });

  it("has userId and name as non-nullable", () => {
    const columns = getTableColumns(locations);
    expect(columns.userId.notNull).toBe(true);
    expect(columns.name.notNull).toBe(true);
  });

  it("has sortOrder with a default value", () => {
    const columns = getTableColumns(locations);
    expect(columns.sortOrder.hasDefault).toBe(true);
  });

  it("has useCount with a default value of 0", () => {
    const columns = getTableColumns(locations);
    expect(columns.useCount.hasDefault).toBe(true);
  });

  it("has lastUsedAt as nullable", () => {
    const columns = getTableColumns(locations);
    expect(columns.lastUsedAt.notNull).toBe(false);
  });

  it("exports correct inferred types", () => {
    const location: Location = {
      id: "uuid",
      userId: "user-uuid",
      name: "Toy Trunk",
      icon: "🧸",
      sortOrder: 0,
      lastUsedAt: null,
      useCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    expect(location.name).toBe("Toy Trunk");

    const newLocation: NewLocation = {
      userId: "user-uuid",
      name: "Narnia Cupboard",
    };
    expect(newLocation.name).toBe("Narnia Cupboard");
  });
});

describe("capture_sessions table", () => {
  it("has the correct table name", () => {
    expect(getTableName(captureSessions)).toBe("capture_sessions");
  });

  it("has all expected columns", () => {
    const columns = getTableColumns(captureSessions);
    const columnNames = Object.keys(columns);
    expect(columnNames).toContain("id");
    expect(columnNames).toContain("userId");
    expect(columnNames).toContain("startedAt");
    expect(columnNames).toContain("endedAt");
    expect(columnNames).toContain("itemCount");
    expect(columnNames).toContain("summary");
  });

  it("has userId as non-nullable", () => {
    const columns = getTableColumns(captureSessions);
    expect(columns.userId.notNull).toBe(true);
  });

  it("has endedAt as nullable (session may still be active)", () => {
    const columns = getTableColumns(captureSessions);
    expect(columns.endedAt.notNull).toBe(false);
  });

  it("has itemCount with a default value", () => {
    const columns = getTableColumns(captureSessions);
    expect(columns.itemCount.hasDefault).toBe(true);
  });

  it("has summary as nullable JSONB", () => {
    const columns = getTableColumns(captureSessions);
    expect(columns.summary.notNull).toBe(false);
  });

  it("exports correct inferred types", () => {
    const session: CaptureSession = {
      id: "uuid",
      userId: "user-uuid",
      startedAt: new Date(),
      endedAt: null,
      itemCount: 0,
      summary: null,
    };
    expect(session.itemCount).toBe(0);

    const newSession: NewCaptureSession = { userId: "user-uuid" };
    expect(newSession.userId).toBe("user-uuid");
  });
});
