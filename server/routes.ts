import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertCustomerSchema, 
  insertVehicleSchema, 
  insertServiceSchema, 
  insertJobSchema, 
  insertJobServiceSchema,
  insertUserSchema,
  jobStatusEnum
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Customers API
  app.get("/api/customers", async (req, res) => {
    const customers = await storage.getCustomers();
    res.json(customers);
  });
  
  app.get("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    const customer = await storage.getCustomer(id);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.json(customer);
  });
  
  app.post("/api/customers", async (req, res) => {
    try {
      const data = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(data);
      res.status(201).json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while creating the customer" });
    }
  });
  
  app.put("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    try {
      const data = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, data);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while updating the customer" });
    }
  });
  
  app.delete("/api/customers/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid customer ID" });
    }
    
    const success = await storage.deleteCustomer(id);
    if (!success) {
      return res.status(404).json({ message: "Customer not found" });
    }
    
    res.status(204).end();
  });
  
  // Vehicles API
  app.get("/api/vehicles", async (req, res) => {
    const customerId = req.query.customerId ? parseInt(req.query.customerId as string) : undefined;
    
    if (customerId) {
      const vehicles = await storage.getVehiclesByCustomer(customerId);
      return res.json(vehicles);
    }
    
    const vehicles = await storage.getVehicles();
    res.json(vehicles);
  });
  
  app.get("/api/vehicles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid vehicle ID" });
    }
    
    const vehicle = await storage.getVehicle(id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    res.json(vehicle);
  });
  
  app.get("/api/vehicles/plate/:plate", async (req, res) => {
    const plate = req.params.plate;
    const vehicle = await storage.getVehicleByPlate(plate);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    res.json(vehicle);
  });
  
  app.post("/api/vehicles", async (req, res) => {
    try {
      const data = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(data);
      res.status(201).json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while creating the vehicle" });
    }
  });
  
  app.put("/api/vehicles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid vehicle ID" });
    }
    
    try {
      const data = insertVehicleSchema.partial().parse(req.body);
      const vehicle = await storage.updateVehicle(id, data);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while updating the vehicle" });
    }
  });
  
  app.delete("/api/vehicles/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid vehicle ID" });
    }
    
    const success = await storage.deleteVehicle(id);
    if (!success) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    res.status(204).end();
  });
  
  // Services API
  app.get("/api/services", async (req, res) => {
    const services = await storage.getServices();
    res.json(services);
  });
  
  app.get("/api/services/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }
    
    const service = await storage.getService(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    res.json(service);
  });
  
  app.post("/api/services", async (req, res) => {
    try {
      // Fiyat sayı olarak geliyorsa string'e çevir, aksi halde direkt kullan
      const requestData = { ...req.body };
      if (typeof requestData.price === 'number') {
        requestData.price = requestData.price.toString();
      }
      
      const data = insertServiceSchema.parse(requestData);
      const service = await storage.createService(data);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while creating the service" });
    }
  });
  
  app.put("/api/services/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }
    
    try {
      // Fiyat sayı olarak geliyorsa string'e çevir, aksi halde direkt kullan
      const requestData = { ...req.body };
      if (typeof requestData.price === 'number') {
        requestData.price = requestData.price.toString();
      }
      
      const data = insertServiceSchema.partial().parse(requestData);
      const service = await storage.updateService(id, data);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid service data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while updating the service" });
    }
  });
  
  app.delete("/api/services/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }
    
    const success = await storage.deleteService(id);
    if (!success) {
      return res.status(404).json({ message: "Service not found" });
    }
    
    res.status(204).end();
  });
  
  // Jobs API
  app.get("/api/jobs", async (req, res) => {
    const dateParam = req.query.date as string;
    
    if (dateParam) {
      try {
        const date = new Date(dateParam);
        if (isNaN(date.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
        
        const jobs = await storage.getJobsByDate(date);
        return res.json(jobs);
      } catch (error) {
        return res.status(400).json({ message: "Invalid date" });
      }
    }
    
    const jobs = await storage.getJobs();
    res.json(jobs);
  });
  
  app.get("/api/jobs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }
    
    const job = await storage.getJob(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    res.json(job);
  });
  
  app.post("/api/jobs", async (req, res) => {
    try {
      const data = insertJobSchema.parse(req.body);
      const job = await storage.createJob(data);
      res.status(201).json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while creating the job" });
    }
  });
  
  app.put("/api/jobs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }
    
    try {
      const data = insertJobSchema.partial().parse(req.body);
      const job = await storage.updateJob(id, data);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while updating the job" });
    }
  });
  
  app.delete("/api/jobs/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }
    
    const success = await storage.deleteJob(id);
    if (!success) {
      return res.status(404).json({ message: "Job not found" });
    }
    
    res.status(204).end();
  });
  
  // Job Services API
  app.get("/api/jobs/:id/services", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }
    
    const services = await storage.getJobServices(id);
    res.json(services);
  });
  
  app.post("/api/jobs/:id/services", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid job ID" });
    }
    
    try {
      const { serviceId } = insertJobServiceSchema.parse({ ...req.body, jobId: id });
      const jobService = await storage.addJobService({ jobId: id, serviceId });
      res.status(201).json(jobService);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid job service data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while adding the service to the job" });
    }
  });
  
  app.delete("/api/jobs/:jobId/services/:serviceId", async (req, res) => {
    const jobId = parseInt(req.params.jobId);
    const serviceId = parseInt(req.params.serviceId);
    
    if (isNaN(jobId) || isNaN(serviceId)) {
      return res.status(400).json({ message: "Invalid job or service ID" });
    }
    
    const success = await storage.removeJobService(jobId, serviceId);
    if (!success) {
      return res.status(404).json({ message: "Job service not found" });
    }
    
    res.status(204).end();
  });
  
  // Users API
  app.get("/api/users", async (req, res) => {
    const users = await storage.getUsers();
    res.json(users);
  });
  
  app.get("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  });
  
  app.post("/api/users", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const user = await storage.createUser(data);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while creating the user" });
    }
  });
  
  app.put("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    try {
      const data = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, data);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "An error occurred while updating the user" });
    }
  });
  
  app.delete("/api/users/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    const success = await storage.deleteUser(id);
    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(204).end();
  });
  
  // Statistics API
  app.get("/api/stats/daily", async (req, res) => {
    const dateParam = req.query.date as string;
    const date = dateParam ? new Date(dateParam) : new Date();
    
    if (isNaN(date.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }
    
    const stats = await storage.getDailyStats(date);
    res.json(stats);
  });

  const httpServer = createServer(app);
  return httpServer;
}
