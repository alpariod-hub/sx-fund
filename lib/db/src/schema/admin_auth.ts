import { pgTable, serial, text, timestamp, boolean, inet } from "drizzle-orm/pg-core";

export const adminOtpTable = pgTable("admin_otp", {
  id: serial("id").primaryKey(),
  telegramUsername: text("telegram_username").notNull(),
  code: text("code").notNull(),
  used: boolean("used").notNull().default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminAccessLogTable = pgTable("admin_access_log", {
  id: serial("id").primaryKey(),
  telegramUsername: text("telegram_username").notNull(),
  action: text("action").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type AdminOtp = typeof adminOtpTable.$inferSelect;
export type AdminAccessLog = typeof adminAccessLogTable.$inferSelect;
