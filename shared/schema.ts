import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  isValid: boolean("is_valid").default(true),
  campaignId: integer("campaign_id"),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  messageTemplate: text("message_template").notNull(),
  delayBetweenMessages: integer("delay_between_messages").default(10),
  status: text("status").notNull().default("draft"), // draft, active, completed, paused
  totalContacts: integer("total_contacts").default(0),
  sentCount: integer("sent_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messageLog = pgTable("message_log", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  contactId: integer("contact_id").notNull(),
  status: text("status").notNull(), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  error: text("error"),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  sentCount: true,
});

export const insertMessageLogSchema = createInsertSchema(messageLog).omit({
  id: true,
  sentAt: true,
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type MessageLog = typeof messageLog.$inferSelect;
export type InsertMessageLog = z.infer<typeof insertMessageLogSchema>;
