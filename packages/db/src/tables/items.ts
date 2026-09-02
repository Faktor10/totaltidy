import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { captureSessions } from "./capture-sessions";
import { locations } from "./locations";
import { users } from "./users";

export const itemStatusEnum = pgEnum("item_status", [
  "inbox",
  "kept",
  "sell",
  "donate",
  "sold",
  "donated",
]);

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  locationId: uuid("location_id").references(() => locations.id, { onDelete: "set null" }),
  captureSessionId: uuid("capture_session_id").references(() => captureSessions.id, {
    onDelete: "set null",
  }),
  cloudinaryPublicId: text("cloudinary_public_id").notNull(),
  originalImageUrl: text("original_image_url").notNull(),
  processedImageUrl: text("processed_image_url"),
  label: text("label"),
  tags: jsonb("tags").$type<string[]>(),
  category: text("category"),
  status: itemStatusEnum("status").notNull().default("inbox"),
  createdAt: timestamp("created_at", { mode: "date", withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
