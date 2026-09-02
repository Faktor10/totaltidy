import { integer, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const captureSessions = pgTable("capture_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp("ended_at", { mode: "date", withTimezone: true }),
  itemCount: integer("item_count").notNull().default(0),
  summary: jsonb("summary"),
});

export type CaptureSession = typeof captureSessions.$inferSelect;
export type NewCaptureSession = typeof captureSessions.$inferInsert;
