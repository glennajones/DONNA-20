import { users, type User, type InsertUser } from "@shared/schema";
import bcrypt from "bcrypt";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUserCredentials(username: string, password: string): Promise<User | null>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.currentId = 1;
    this.seedDemoUsers();
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
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
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
