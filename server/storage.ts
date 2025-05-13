import { 
  customers, Customer, InsertCustomer,
  vehicles, Vehicle, InsertVehicle,
  services, Service, InsertService,
  jobs, Job, InsertJob,
  jobServices, JobService, InsertJobService,
  users, User, InsertUser
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
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
  
  // Job methods
  getJobs(): Promise<Job[]>;
  getJobsByDate(date: Date): Promise<Job[]>;
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

  // Statistics methods
  getDailyStats(date: Date): Promise<{
    totalAmount: number;
    totalPaid: number;
    totalJobs: number;
    pendingPayments: number;
  }>;
}

export class MemStorage implements IStorage {
  private customers: Map<number, Customer>;
  private vehicles: Map<number, Vehicle>;
  private services: Map<number, Service>;
  private jobs: Map<number, Job>;
  private jobServices: Map<string, JobService>;
  private users: Map<number, User>;
  
  private customerIdCounter: number;
  private vehicleIdCounter: number;
  private serviceIdCounter: number;
  private jobIdCounter: number;
  private userIdCounter: number;
  
  constructor() {
    this.customers = new Map();
    this.vehicles = new Map();
    this.services = new Map();
    this.jobs = new Map();
    this.jobServices = new Map();
    this.users = new Map();
    
    this.customerIdCounter = 1;
    this.vehicleIdCounter = 1;
    this.serviceIdCounter = 1;
    this.jobIdCounter = 1;
    this.userIdCounter = 1;
    
    // Initialize with some default services
    this.seedServices();
    this.seedUsers();
  }
  
  private seedServices() {
    const defaultServices = [
      { id: this.serviceIdCounter++, name: "Dış Yıkama", price: 50, description: "Aracın dış yıkaması" },
      { id: this.serviceIdCounter++, name: "İç Temizlik", price: 70, description: "Aracın iç temizliği" },
      { id: this.serviceIdCounter++, name: "Motor Yıkama", price: 100, description: "Motor bölümü temizliği" },
      { id: this.serviceIdCounter++, name: "Pasta Cila", price: 150, description: "Araç dış yüzeyi için pasta cila işlemi" },
      { id: this.serviceIdCounter++, name: "Detaylı İç Temizlik", price: 200, description: "Kapsamlı iç temizlik" },
      { id: this.serviceIdCounter++, name: "Seramik Kaplama", price: 1500, description: "Araç dış yüzeyi için koruyucu seramik kaplama" },
    ];
    
    for (const service of defaultServices) {
      this.services.set(service.id, service);
    }
  }
  
  private seedUsers() {
    const defaultUser = {
      id: this.userIdCounter++,
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      fullName: "Demo Admin",
      isAdmin: true
    };
    
    this.users.set(defaultUser.id, defaultUser);
  }
  
  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }
  
  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }
  
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const id = this.customerIdCounter++;
    const newCustomer: Customer = {
      id,
      ...customer,
      createdAt: new Date()
    };
    this.customers.set(id, newCustomer);
    return newCustomer;
  }
  
  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;
    
    const updatedCustomer = {
      ...existingCustomer,
      ...customer
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }
  
  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }
  
  // Vehicle methods
  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }
  
  async getVehiclesByCustomer(customerId: number): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values()).filter(
      vehicle => vehicle.customerId === customerId
    );
  }
  
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }
  
  async getVehicleByPlate(plate: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(
      vehicle => vehicle.plate.toLowerCase() === plate.toLowerCase()
    );
  }
  
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleIdCounter++;
    const newVehicle: Vehicle = {
      id,
      ...vehicle,
      createdAt: new Date()
    };
    this.vehicles.set(id, newVehicle);
    return newVehicle;
  }
  
  async updateVehicle(id: number, vehicle: Partial<InsertVehicle>): Promise<Vehicle | undefined> {
    const existingVehicle = this.vehicles.get(id);
    if (!existingVehicle) return undefined;
    
    const updatedVehicle = {
      ...existingVehicle,
      ...vehicle
    };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }
  
  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }
  
  // Service methods
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }
  
  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }
  
  async createService(service: InsertService): Promise<Service> {
    const id = this.serviceIdCounter++;
    const newService: Service = {
      id,
      ...service
    };
    this.services.set(id, newService);
    return newService;
  }
  
  async updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined> {
    const existingService = this.services.get(id);
    if (!existingService) return undefined;
    
    const updatedService = {
      ...existingService,
      ...service
    };
    this.services.set(id, updatedService);
    return updatedService;
  }
  
  async deleteService(id: number): Promise<boolean> {
    return this.services.delete(id);
  }
  
  // Job methods
  async getJobs(): Promise<Job[]> {
    return Array.from(this.jobs.values());
  }
  
  async getJobsByDate(date: Date): Promise<Job[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.jobs.values()).filter(job => {
      return job.createdAt >= startOfDay && job.createdAt <= endOfDay;
    });
  }
  
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }
  
  async createJob(job: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const newJob: Job = {
      id,
      ...job,
      createdAt: new Date()
    };
    this.jobs.set(id, newJob);
    return newJob;
  }
  
  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job | undefined> {
    const existingJob = this.jobs.get(id);
    if (!existingJob) return undefined;
    
    const updatedJob = {
      ...existingJob,
      ...job
    };
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
  
  async deleteJob(id: number): Promise<boolean> {
    // Remove all associated job services first
    Array.from(this.jobServices.entries())
      .filter(([key, value]) => value.jobId === id)
      .forEach(([key]) => this.jobServices.delete(key));
    
    return this.jobs.delete(id);
  }
  
  // JobService methods
  async getJobServices(jobId: number): Promise<Service[]> {
    const serviceIds = Array.from(this.jobServices.values())
      .filter(js => js.jobId === jobId)
      .map(js => js.serviceId);
    
    return serviceIds.map(id => this.services.get(id)!).filter(Boolean);
  }
  
  async addJobService(jobService: InsertJobService): Promise<JobService> {
    const key = `${jobService.jobId}-${jobService.serviceId}`;
    this.jobServices.set(key, jobService);
    return jobService;
  }
  
  async removeJobService(jobId: number, serviceId: number): Promise<boolean> {
    const key = `${jobId}-${serviceId}`;
    return this.jobServices.delete(key);
  }
  
  // User methods
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      user => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = {
      id,
      ...user,
      isAdmin: false
    };
    this.users.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = {
      ...existingUser,
      ...user
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Statistics methods
  async getDailyStats(date: Date): Promise<{
    totalAmount: number;
    totalPaid: number;
    totalJobs: number;
    pendingPayments: number;
  }> {
    const jobsForDate = await this.getJobsByDate(date);
    
    const totalAmount = jobsForDate.reduce((sum, job) => sum + Number(job.totalAmount), 0);
    const totalPaid = jobsForDate.reduce((sum, job) => sum + Number(job.paidAmount), 0);
    const totalJobs = jobsForDate.length;
    const pendingPayments = jobsForDate.filter(job => Number(job.paidAmount) < Number(job.totalAmount)).length;
    
    return {
      totalAmount,
      totalPaid,
      totalJobs,
      pendingPayments
    };
  }
}

export const storage = new MemStorage();
