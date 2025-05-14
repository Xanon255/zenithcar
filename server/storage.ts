import { db } from "./db";
import { 
  customers, vehicles, services, jobs, jobServices, users, expenses, customerAnalytics,
  type Customer, type InsertCustomer, 
  type Vehicle, type InsertVehicle, 
  type Service, type InsertService, 
  type Job, type InsertJob, 
  type JobService, type InsertJobService, 
  type User, type InsertUser,
  type Expense, type InsertExpense,
  type CustomerAnalytic
} from "@shared/schema";
import { eq, and, desc, count, sum, max, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  getCustomerAnalytics(customerId: number): Promise<CustomerAnalytic | undefined>;
  
  // Vehicle methods
  getVehicles(): Promise<Vehicle[]>;
  getVehiclesByCustomer(customerId: number): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByPlate(plate: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  
  // Service methods
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  getPopularServices(): Promise<{name: string, count: number}[]>;
  
  // Job methods
  getJobs(): Promise<Job[]>;
  getJobsByDate(date: Date): Promise<Job[]>;
  getJobsByCustomer(customerId: number): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  
  // JobService methods
  getJobServices(jobId: number): Promise<Service[]>;
  addJobService(jobService: InsertJobService): Promise<JobService>;
  removeJobService(jobId: number, serviceId: number): Promise<boolean>;
  
  // User methods
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Expense methods
  getExpenses(): Promise<Expense[]>;
  getExpensesByCategory(category: string): Promise<Expense[]>;
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Statistics methods
  getDailyStats(date: Date): Promise<{
    totalAmount: number;
    totalPaid: number;
    totalJobs: number;
    pendingPayments: number;
  }>;
  
  getPaymentMethodStats(): Promise<{
    method: string;
    count: number;
    total: number;
  }[]>;
  
  getNetProfit(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  }>;
  
  // Backup & Restore methods
  exportBackup(): Promise<{
    customers: Customer[];
    vehicles: Vehicle[];
    services: Service[];
    jobs: Job[];
    jobServices: JobService[];
    users: User[];
    expenses: Expense[];
    timestamp: string;
    version: string;
  }>;
  
  importBackup(data: {
    customers: Customer[];
    vehicles: Vehicle[];
    services: Service[];
    jobs: Job[];
    jobServices: JobService[];
    users: User[];
    expenses: Expense[];
    timestamp: string;
    version: string;
  }): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.id));
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(customer).returning();
    return result[0];
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const result = await db.update(customers).set(customer).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async deleteCustomer(id: number): Promise<boolean> {
    try {
      await db.delete(customers).where(eq(customers.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting customer:", error);
      return false;
    }
  }

  async getCustomerAnalytics(customerId: number): Promise<CustomerAnalytic | undefined> {
    // Calculate customer analytics on the fly
    const totalSpentResult = await db
      .select({
        totalSpent: sum(jobs.totalAmount)
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.customerId, customerId),
          // İptal edilmiş işleri müşteri analizine dahil etmiyoruz
          sql`${jobs.status} != 'iptal'`
        )
      );
      
    const jobCountResult = await db
      .select({
        jobCount: count()
      })
      .from(jobs)
      .where(
        and(
          eq(jobs.customerId, customerId),
          // İptal edilmiş işleri müşteri analizine dahil etmiyoruz
          sql`${jobs.status} != 'iptal'`
        )
      );
      
    const lastVisitResult = await db
      .select({
        lastVisit: max(jobs.createdAt)
      })
      .from(jobs)
      .where(eq(jobs.customerId, customerId));
      
    const totalSpent = totalSpentResult[0]?.totalSpent || 0;
    const jobCount = jobCountResult[0]?.jobCount || 0;
    const lastVisit = lastVisitResult[0]?.lastVisit;
    
    return {
      customerId: customerId,
      totalSpent: totalSpent,
      jobCount: Number(jobCount),
      lastVisit: lastVisit as Date
    };
  }

  // Vehicle methods
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles).orderBy(desc(vehicles.id));
  }

  async getVehiclesByCustomer(customerId: number): Promise<Vehicle[]> {
    return await db.select().from(vehicles).where(eq(vehicles.customerId, customerId));
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return result[0];
  }

  async getVehicleByPlate(plate: string): Promise<Vehicle | undefined> {
    const result = await db.select().from(vehicles).where(eq(vehicles.plate, plate));
    return result[0];
  }

  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const result = await db.insert(vehicles).values(vehicle).returning();
    return result[0];
  }

  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const result = await db.update(vehicles).set(vehicle).where(eq(vehicles.id, id)).returning();
    return result[0];
  }

  async deleteVehicle(id: number): Promise<boolean> {
    try {
      await db.delete(vehicles).where(eq(vehicles.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      return false;
    }
  }

  // Service methods
  async getServices(): Promise<Service[]> {
    return await db.select().from(services).orderBy(services.name);
  }

  async getService(id: number): Promise<Service | undefined> {
    const result = await db.select().from(services).where(eq(services.id, id));
    return result[0];
  }

  async createService(service: InsertService): Promise<Service> {
    const result = await db.insert(services).values(service).returning();
    return result[0];
  }

  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const result = await db.update(services).set(service).where(eq(services.id, id)).returning();
    return result[0];
  }

  async deleteService(id: number): Promise<boolean> {
    try {
      await db.delete(services).where(eq(services.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting service:", error);
      return false;
    }
  }
  
  async getPopularServices(): Promise<{name: string, count: number}[]> {
    const result = await db
      .select({
        serviceId: jobServices.serviceId,
        name: services.name,
        count: count(),
      })
      .from(jobServices)
      .leftJoin(services, eq(jobServices.serviceId, services.id))
      .leftJoin(jobs, eq(jobServices.jobId, jobs.id))
      .where(sql`${jobs.status} != 'iptal'`)
      .groupBy(jobServices.serviceId, services.name)
      .orderBy(desc(count()));
      
    return result.map(item => ({
      name: item.name || "",
      count: Number(item.count) || 0
    }));
  }

  // Job methods
  async getJobs(): Promise<Job[]> {
    return await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  }

  async getJobsByDate(date: Date): Promise<Job[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(jobs)
      .where(
        and(
          sql`${jobs.createdAt} >= ${startDate}`,
          sql`${jobs.createdAt} <= ${endDate}`
        )
      )
      .orderBy(desc(jobs.createdAt));
  }

  async getJobsByCustomer(customerId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.customerId, customerId))
      .orderBy(desc(jobs.createdAt));
  }

  async getJob(id: number): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id));
    return result[0];
  }

  async createJob(job: InsertJob): Promise<Job> {
    const result = await db.insert(jobs).values(job).returning();
    return result[0];
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const result = await db.update(jobs).set(job).where(eq(jobs.id, id)).returning();
    return result[0];
  }

  async deleteJob(id: number): Promise<boolean> {
    try {
      // First delete related job services
      await db.delete(jobServices).where(eq(jobServices.jobId, id));
      // Then delete the job
      await db.delete(jobs).where(eq(jobs.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting job:", error);
      return false;
    }
  }

  // JobService methods
  async getJobServices(jobId: number): Promise<Service[]> {
    const result = await db
      .select({
        id: services.id,
        name: services.name,
        price: services.price,
        description: services.description
      })
      .from(jobServices)
      .innerJoin(services, eq(jobServices.serviceId, services.id))
      .where(eq(jobServices.jobId, jobId));
      
    return result;
  }

  async addJobService(jobService: InsertJobService): Promise<JobService> {
    const result = await db.insert(jobServices).values(jobService).returning();
    return result[0];
  }

  async removeJobService(jobId: number, serviceId: number): Promise<boolean> {
    try {
      await db
        .delete(jobServices)
        .where(
          and(
            eq(jobServices.jobId, jobId),
            eq(jobServices.serviceId, serviceId)
          )
        );
      return true;
    } catch (error) {
      console.error("Error removing job service:", error);
      return false;
    }
  }

  // User methods
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Expense methods
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.date));
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(eq(expenses.category, category))
      .orderBy(desc(expenses.date));
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db
      .select()
      .from(expenses)
      .where(
        and(
          sql`${expenses.date} >= ${startDate}`,
          sql`${expenses.date} <= ${endDate}`
        )
      )
      .orderBy(desc(expenses.date));
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result[0];
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    // Amount'u string'e çevir
    const expenseData = {
      ...expense,
      amount: expense.amount.toString()
    };
    
    const result = await db.insert(expenses).values(expenseData).returning();
    return result[0];
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const expenseData: any = {...expense};
    
    // Eğer amount varsa string'e çevir
    if (expenseData.amount !== undefined) {
      expenseData.amount = expenseData.amount.toString();
    }
    
    const result = await db.update(expenses).set(expenseData).where(eq(expenses.id, id)).returning();
    return result[0];
  }

  async deleteExpense(id: number): Promise<boolean> {
    try {
      await db.delete(expenses).where(eq(expenses.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting expense:", error);
      return false;
    }
  }

  // Statistics methods
  async getDailyStats(date: Date): Promise<{
    totalAmount: number;
    totalPaid: number;
    totalJobs: number;
    pendingPayments: number;
  }> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    console.log("Günlük istatistik için tarih aralığı:", startDate, endDate);
    console.log("Gelen tarih:", date);
    
    // Tüm işleri al ve döndür (iptal edilenler hariç)
    const allJobs = await db
      .select()
      .from(jobs)
      .where(
        and(
          sql`DATE(${jobs.createdAt}) = DATE(${date})`,
          sql`${jobs.status} != 'iptal'`
        )
      );
      
    console.log("Bulunan işler:", allJobs);
    
    const jobsResult = await db
      .select({
        totalAmount: sum(jobs.totalAmount),
        totalPaid: sum(jobs.paidAmount),
        totalJobs: count(),
      })
      .from(jobs)
      .where(
        and(
          sql`DATE(${jobs.createdAt}) = DATE(${date})`,
          // İptal edilmiş işleri toplam tutara dahil etmiyoruz
          sql`${jobs.status} != 'iptal'`
        )
      );
      
    const result = jobsResult[0];
    
    const totalAmount = Number(result?.totalAmount || 0);
    const totalPaid = Number(result?.totalPaid || 0);
    const totalJobs = Number(result?.totalJobs || 0);
    
    return {
      totalAmount,
      totalPaid,
      totalJobs,
      pendingPayments: totalAmount - totalPaid
    };
  }
  
  async getPaymentMethodStats(): Promise<{
    method: string;
    count: number;
    total: number;
  }[]> {
    const result = await db
      .select({
        method: jobs.paymentMethod,
        count: count(),
        total: sum(jobs.paidAmount)
      })
      .from(jobs)
      .where(
        and(
          sql`${jobs.paidAmount} > 0`,
          // İptal edilmiş işleri istatistiklere dahil etmiyoruz
          sql`${jobs.status} != 'iptal'`
        )
      )
      .groupBy(jobs.paymentMethod);
      
    return result.map(item => ({
      method: item.method,
      count: Number(item.count) || 0,
      total: Number(item.total) || 0
    }));
  }
  
  async getNetProfit(startDate: Date, endDate: Date): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
  }> {
    const revenueResult = await db
      .select({
        totalRevenue: sum(jobs.totalAmount)
      })
      .from(jobs)
      .where(
        and(
          sql`${jobs.createdAt} >= ${startDate}`,
          sql`${jobs.createdAt} <= ${endDate}`,
          // İptal edilmiş işleri gelir hesabına dahil etmiyoruz
          sql`${jobs.status} != 'iptal'`
        )
      );
      
    const expensesResult = await db
      .select({
        totalExpenses: sum(expenses.amount)
      })
      .from(expenses)
      .where(
        and(
          sql`${expenses.date} >= ${startDate}`,
          sql`${expenses.date} <= ${endDate}`
        )
      );
      
    const totalRevenue = Number(revenueResult[0]?.totalRevenue) || 0;
    const totalExpenses = Number(expensesResult[0]?.totalExpenses) || 0;
    
    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses
    };
  }
  
  // Backup & Restore methods
  async exportBackup(): Promise<{
    customers: Customer[];
    vehicles: Vehicle[];
    services: Service[];
    jobs: Job[];
    jobServices: JobService[];
    users: User[];
    expenses: Expense[];
    timestamp: string;
    version: string;
  }> {
    // Tüm verileri al
    const customersData = await this.getCustomers();
    const vehiclesData = await this.getVehicles();
    const servicesData = await this.getServices();
    const jobsData = await this.getJobs();
    
    // JobServices verisini al
    const jobServicesData = await db.select().from(jobServices).execute();
    const usersData = await this.getUsers();
    const expensesData = await this.getExpenses();
    
    // Şu anki zaman damgası ile yedek ver
    return {
      customers: customersData,
      vehicles: vehiclesData,
      services: servicesData,
      jobs: jobsData,
      jobServices: jobServicesData,
      users: usersData,
      expenses: expensesData,
      timestamp: new Date().toISOString(),
      version: "1.0.0" // Uygulama sürümü
    };
  }
  
  async importBackup(data: {
    customers: Customer[];
    vehicles: Vehicle[];
    services: Service[];
    jobs: Job[];
    jobServices: JobService[];
    users: User[];
    expenses: Expense[];
    timestamp: string;
    version: string;
  }): Promise<boolean> {
    // Veritabanını sıfırla (mevcut verileri temizle)
    try {
      // İlişkisel bütünlüğü korumak için silme sırası önemli
      await db.delete(jobServices);
      await db.delete(jobs);
      await db.delete(vehicles);
      await db.delete(expenses);
      await db.delete(customers);
      
      // Servisleri silme - Sadece sistem servisleri dışındakileri sil
      const allServices = await db.select().from(services);
      for (const service of allServices) {
        if (service.id > 10) { // Sistem servisleri ID'leri 1-10 arasında varsayalım
          await db.delete(services).where(eq(services.id, service.id));
        }
      }
      
      // Admin kullanıcıları silmemek için sadece normal kullanıcıları temizle
      const allUsers = await db.select().from(users);
      for (const user of allUsers) {
        if (!user.isAdmin) { // isAdmin alanını kullan, role yok
          await db.delete(users).where(eq(users.id, user.id));
        }
      }
      
      // Verileri yükle
      for (const customer of data.customers) {
        await db.insert(customers).values({
          ...customer,
          id: undefined // ID'yi otomatik olarak oluştur
        });
      }
      
      for (const vehicle of data.vehicles) {
        await db.insert(vehicles).values({
          ...vehicle,
          id: undefined
        });
      }
      
      for (const service of data.services) {
        // Mevcut sistem servislerini atla
        const existingService = allServices.find(s => s.name === service.name);
        if (!existingService) {
          await db.insert(services).values({
            ...service,
            id: undefined
          });
        }
      }
      
      for (const job of data.jobs) {
        await db.insert(jobs).values({
          ...job,
          id: undefined
        });
      }
      
      for (const jobService of data.jobServices) {
        await db.insert(jobServices).values({
          jobId: jobService.jobId,
          serviceId: jobService.serviceId
        });
      }
      
      for (const user of data.users) {
        // Admin olmayan kullanıcıları ekle
        if (!user.isAdmin) {
          await db.insert(users).values({
            ...user,
            id: undefined
          });
        }
      }
      
      for (const expense of data.expenses) {
        await db.insert(expenses).values({
          ...expense,
          id: undefined
        });
      }
      
      return true;
    } catch (error) {
      console.error("Yedekten geri yükleme hatası:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();