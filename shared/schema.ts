import { pgTable, text, serial, integer, boolean, numeric, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

// Vehicles table
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  plate: text("plate").notNull().unique(),
  brand: text("brand").notNull(),
  model: text("model"),
  color: text("color"),
  customerId: integer("customer_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  description: text("description"),
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  customerId: integer("customer_id").notNull(),
  totalAmount: numeric("total_amount").notNull(),
  paidAmount: numeric("paid_amount").default("0").notNull(),
  status: text("status").notNull().default("bekliyor"), // bekliyor, devam_ediyor, tamamlandi, iptal
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

// JobServices junction table
export const jobServices = pgTable("job_services", {
  jobId: integer("job_id").notNull(),
  serviceId: integer("service_id").notNull(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.jobId, table.serviceId] }),
  };
});

export const insertJobServiceSchema = createInsertSchema(jobServices);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
});

// Types for our schema
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type JobService = typeof jobServices.$inferSelect;
export type InsertJobService = z.infer<typeof insertJobServiceSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Define zod schemas for frontend validation
export const jobStatusEnum = z.enum(["bekliyor", "devam_ediyor", "tamamlandi", "iptal"]);
export type JobStatus = z.infer<typeof jobStatusEnum>;
