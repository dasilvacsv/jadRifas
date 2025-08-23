// lib/db/schema.ts
import {
  pgTable,
  text,
  varchar,
  decimal,
  integer,
  timestamp,
  boolean,
  primaryKey,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from 'drizzle-orm';

// ----------------------------------------------------------------
// ENUMs (Tipos de datos personalizados para estados)
// ----------------------------------------------------------------

export const raffleStatusEnum = pgEnum("raffle_status", ["active", "finished", "cancelled", "draft"]);
export const purchaseStatusEnum = pgEnum("purchase_status", ["pending", "confirmed", "rejected"]);

// ----------------------------------------------------------------
// TABLAS PRINCIPALES
// ----------------------------------------------------------------

export const users = pgTable("users", {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    name: varchar("name", { length: 256 }),
    email: varchar("email", { length: 256 }).notNull().unique(),
    password: text("password"),
    role: text("role", { enum: ["admin", "user"] }).default("user").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const raffles = pgTable("raffles", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  minimumTickets: integer("minimum_tickets").notNull().default(10000),
  status: raffleStatusEnum("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // NUEVO: Almacena el ID del ticket ganador
  winnerTicketId: text("winner_ticket_id").references(() => tickets.id),
});

export const purchases = pgTable("purchases", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: purchaseStatusEnum("status").default("pending").notNull(),
  buyerName: varchar("buyer_name", { length: 256 }),
  buyerEmail: varchar("buyer_email", { length: 256 }).notNull(),
  buyerPhone: varchar("buyer_phone", { length: 50 }),
  paymentReference: text("payment_reference"),
  paymentScreenshotUrl: text("payment_screenshot_url"),
  paymentMethod: varchar("payment_method", { length: 256 }),
  ticketCount: integer("ticket_count").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  raffleId: text("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
});

export const tickets = pgTable("tickets", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  ticketNumber: varchar("ticket_number", { length: 16 }).notNull(),
  raffleId: text("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
  purchaseId: text("purchase_id").notNull().references(() => purchases.id, { onDelete: "cascade" }),
}, (table) => {
    return {
      raffleTicketUnq: uniqueIndex("raffle_ticket_unq").on(table.raffleId, table.ticketNumber),
    };
});

// ----------------------------------------------------------------
// TABLAS SECUNDARIAS Y DE RELACIÓN
// ----------------------------------------------------------------

export const raffleImages = pgTable("raffle_images", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  url: text("url").notNull(),
  raffleId: text("raffle_id").notNull().references(() => raffles.id, { onDelete: "cascade" }),
});

export const paymentMethods = pgTable("payment_methods", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  title: varchar("title", { length: 256 }).notNull().unique(),
  details: text("details").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});


// ----------------------------------------------------------------
// --- RELACIONES CORREGIDAS Y COMPLETAS ---
// ----------------------------------------------------------------

export const raffleRelations = relations(raffles, ({ many, one }) => ({
  purchases: many(purchases),
  tickets: many(tickets),
  images: many(raffleImages),
  // NUEVO: Relación para obtener los datos del ticket ganador
  winnerTicket: one(tickets, {
    fields: [raffles.winnerTicketId],
    references: [tickets.id],
  }),
}));

export const purchaseRelations = relations(purchases, ({ one, many }) => ({
  raffle: one(raffles, {
    fields: [purchases.raffleId],
    references: [raffles.id],
  }),
  tickets: many(tickets),
}));

export const ticketRelations = relations(tickets, ({ one }) => ({
  raffle: one(raffles, {
    fields: [tickets.raffleId],
    references: [raffles.id],
  }),
  purchase: one(purchases, {
    fields: [tickets.purchaseId],
    references: [purchases.id],
  }),
}));

export const raffleImagesRelations = relations(raffleImages, ({ one }) => ({
  raffle: one(raffles, {
    fields: [raffleImages.raffleId],
    references: [raffles.id],
  }),
}));