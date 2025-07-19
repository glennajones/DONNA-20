import { 
  users, 
  registrations, 
  payments, 
  type User, 
  type InsertUser, 
  type Registration, 
  type InsertRegistration, 
  type Payment, 
  type InsertPayment 
} from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUserCredentials(username: string, password: string): Promise<User | null>;
  
  // Registration methods
  getRegistration(id: number): Promise<Registration | undefined>;
  getRegistrations(): Promise<Registration[]>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  updateRegistrationStatus(id: number, status: Registration["status"]): Promise<Registration | undefined>;
  
  // Payment methods
  getPayment(id: number): Promise<Payment | undefined>;
  getPaymentsByRegistration(registrationId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: Payment["status"], stripePaymentIntentId?: string): Promise<Payment | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private registrations: Map<number, Registration>;
  private payments: Map<number, Payment>;
  private currentUserId: number;
  private currentRegistrationId: number;
  private currentPaymentId: number;

  constructor() {
    this.users = new Map();
    this.registrations = new Map();
    this.payments = new Map();
    this.currentUserId = 1;
    this.currentRegistrationId = 1;
    this.currentPaymentId = 1;
    this.seedDemoUsers();
    this.seedDemoRegistrations();
  }

  private async seedDemoUsers() {
    // Create demo users with hashed passwords
    const demoUsers = [
      {
        username: "admin",
        password: await bcrypt.hash("admin123", 10),
        name: "John Admin",
        role: "admin" as const,
      },
      {
        username: "manager",
        password: await bcrypt.hash("manager123", 10),
        name: "Sarah Manager",
        role: "manager" as const,
      },
      {
        username: "coach",
        password: await bcrypt.hash("coach123", 10),
        name: "Mike Coach",
        role: "coach" as const,
      },
    ];

    for (const userData of demoUsers) {
      await this.createUser(userData);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  private async seedDemoRegistrations() {
    const demoRegistrations = [
      {
        name: "Emma Wilson",
        email: "emma.wilson@email.com",
        phone: "555-0123",
        dateOfBirth: "2010-05-15",
        playerType: "player" as const,
        emergencyContact: "Sarah Wilson",
        emergencyPhone: "555-0124",
        medicalInfo: "No known allergies",
        status: "approved" as const,
        registrationFee: "150.00",
      },
      {
        name: "Alex Johnson",
        email: "alex.johnson@email.com", 
        phone: "555-0125",
        dateOfBirth: "2009-08-22",
        playerType: "player" as const,
        emergencyContact: "Mark Johnson",
        emergencyPhone: "555-0126",
        medicalInfo: "Asthma - has inhaler",
        status: "pending" as const,
        registrationFee: "150.00",
      },
      {
        name: "Maria Garcia",
        email: "maria.garcia@email.com",
        phone: "555-0127", 
        dateOfBirth: "2011-03-10",
        playerType: "player" as const,
        emergencyContact: "Carlos Garcia",
        emergencyPhone: "555-0128",
        medicalInfo: "",
        status: "approved" as const,
        registrationFee: "150.00",
      },
    ];

    for (const regData of demoRegistrations) {
      await this.createRegistration(regData);
    }
  }

  // Registration methods
  async getRegistration(id: number): Promise<Registration | undefined> {
    return this.registrations.get(id);
  }

  async getRegistrations(): Promise<Registration[]> {
    return Array.from(this.registrations.values()).sort((a, b) => b.id - a.id);
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const id = this.currentRegistrationId++;
    const now = new Date();
    const registration: Registration = {
      ...insertRegistration,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.registrations.set(id, registration);
    return registration;
  }

  async updateRegistrationStatus(id: number, status: Registration["status"]): Promise<Registration | undefined> {
    const registration = this.registrations.get(id);
    if (!registration) return undefined;
    
    const updatedRegistration = {
      ...registration,
      status,
      updatedAt: new Date(),
    };
    this.registrations.set(id, updatedRegistration);
    return updatedRegistration;
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async getPaymentsByRegistration(registrationId: number): Promise<Payment[]> {
    return Array.from(this.payments.values())
      .filter(payment => payment.registrationId === registrationId)
      .sort((a, b) => b.id - a.id);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.currentPaymentId++;
    const payment: Payment = {
      ...insertPayment,
      id,
      createdAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePaymentStatus(id: number, status: Payment["status"], stripePaymentIntentId?: string): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = {
      ...payment,
      status,
      stripePaymentIntentId: stripePaymentIntentId || payment.stripePaymentIntentId,
      paidAt: status === "completed" ? new Date() : payment.paidAt,
    };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  async validateUserCredentials(username: string, password: string): Promise<User | null> {
    const user = await this.getUserByUsername(username);
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return user;
  }
}

export const storage = new MemStorage();
