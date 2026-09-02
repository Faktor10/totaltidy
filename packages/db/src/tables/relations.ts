import { relations } from "drizzle-orm";
import { captureSessions } from "./capture-sessions";
import { items } from "./items";
import { locations } from "./locations";
import { accounts, sessions, users } from "./users";

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  items: many(items),
  locations: many(locations),
  captureSessions: many(captureSessions),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  user: one(users, { fields: [locations.userId], references: [users.id] }),
  items: many(items),
}));

export const captureSessionsRelations = relations(captureSessions, ({ one, many }) => ({
  user: one(users, { fields: [captureSessions.userId], references: [users.id] }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ one }) => ({
  user: one(users, { fields: [items.userId], references: [users.id] }),
  location: one(locations, { fields: [items.locationId], references: [locations.id] }),
  captureSession: one(captureSessions, {
    fields: [items.captureSessionId],
    references: [captureSessions.id],
  }),
}));
