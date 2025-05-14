import { pgTable, text, serial, integer, boolean, numeric, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define payment method enum
export const paymentMethodEnum = z.enum(["nakit", "kredi_karti", "havale_eft"]);
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;

// Define job status enum
export const jobStatusEnum = z.enum(["bekliyor", "devam_ediyor", "tamamlandi", "iptal"]);
export type JobStatus = z.infer<typeof jobStatusEnum>;

// Define expense categories
export const EXPENSE_CATEGORIES = ["malzeme", "kira", "su", "elektrik", "personel", "diger"] as const;
export const expenseCategoryEnum = z.enum(EXPENSE_CATEGORIES);
export type ExpenseCategory = z.infer<typeof expenseCategoryEnum>;

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
}).extend({
  name: z.string().min(1, "Müşteri adı zorunludur"),
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
}).extend({
  plate: z.string().min(1, "Plaka numarası zorunludur"),
  brand: z.string().min(1, "Araç markası zorunludur"),
  customerId: z.number().positive("Lütfen müşteri seçiniz"),
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
  paymentMethod: text("payment_method").default("nakit").notNull(), // nakit, kredi_karti, havale_eft
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

// Expenses table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: numeric("amount").notNull(),
  category: text("category").notNull(), // malzeme, kira, su, elektrik, personel, diğer
  date: timestamp("date").defaultNow().notNull(),
  notes: text("notes"),
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
}).extend({
  amount: z.union([z.number(), z.string()]).transform(val => 
    typeof val === 'string' ? parseFloat(val) : val
  ),
  category: expenseCategoryEnum,
});

// Customer Analysis view for aggregating customer spending
export const customerAnalytics = pgTable("customer_analytics_view", {
  customerId: integer("customer_id").notNull(),
  totalSpent: numeric("total_spent").notNull(),
  jobCount: integer("job_count").notNull(),
  lastVisit: timestamp("last_visit"),
});

// Sistem ayarları tablosu
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
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

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type CustomerAnalytic = typeof customerAnalytics.$inferSelect;

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;