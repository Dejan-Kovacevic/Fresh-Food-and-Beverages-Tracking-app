import { pgTable, uuid, text, boolean, integer, date, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const fitnessProfilesTable = pgTable("fitness_profiles", {
  id: uuid("id").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  days: integer("days").array().notNull().default([2, 5]),
  time: text("time").notNull().default("18:00"),
  timezone: text("timezone").notNull().default("Europe/Zurich"),
  subscriptionId: text("subscription_id"),
  revision: integer("revision").notNull().default(1),
  scheduledUntil: timestamp("scheduled_until", { withTimezone: true }),
  error: text("error"),
  lastTestAt: timestamp("last_test_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fitnessVisitsTable = pgTable("fitness_visits", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  profileId: uuid("profile_id").notNull().references(() => fitnessProfilesTable.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
}, (table) => [uniqueIndex("fitness_visit_day").on(table.profileId, table.date)]);

// Durable outbox: the id is also OneSignal's idempotency key, so retries cannot
// duplicate messages even if the process stops after OneSignal accepts a send.
export const fitnessMessagesTable = pgTable("fitness_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").notNull().references(() => fitnessProfilesTable.id, { onDelete: "cascade" }),
  revision: integer("revision").notNull(),
  sendAt: timestamp("send_at", { withTimezone: true }).notNull(),
  messageId: text("message_id"),
}, (table) => [uniqueIndex("fitness_message_slot").on(table.profileId, table.revision, table.sendAt)]);

export type FitnessProfile = typeof fitnessProfilesTable.$inferSelect;
