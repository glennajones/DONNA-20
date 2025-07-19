import { 
  users, 
  registrations, 
  payments,
  scheduleEvents,
  type User, 
  type InsertUser, 
  type Registration, 
  type InsertRegistration, 
  type Payment, 
  type InsertPayment,
  type ScheduleEvent,
  type InsertScheduleEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ne } from "drizzle-orm";
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
  
  // Schedule methods
  getScheduleEvent(id: number): Promise<ScheduleEvent | undefined>;
  getScheduleEvents(from?: string, to?: string): Promise<ScheduleEvent[]>;
  createScheduleEvent(event: InsertScheduleEvent): Promise<ScheduleEvent>;
  updateScheduleEvent(id: number, event: Partial<InsertScheduleEvent>): Promise<ScheduleEvent | undefined>;
  deleteScheduleEvent(id: number): Promise<boolean>;
  checkScheduleConflict(court: string, date: string, time: string, duration: number, excludeId?: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
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

  // Registration methods
  async getRegistration(id: number): Promise<Registration | undefined> {
    const [registration] = await db.select().from(registrations).where(eq(registrations.id, id));
    return registration || undefined;
  }

  async getRegistrations(): Promise<Registration[]> {
    return await db.select().from(registrations).orderBy(registrations.id);
  }

  async createRegistration(insertRegistration: InsertRegistration): Promise<Registration> {
    const [registration] = await db
      .insert(registrations)
      .values(insertRegistration)
      .returning();
    return registration;
  }

  async updateRegistrationStatus(id: number, status: Registration["status"]): Promise<Registration | undefined> {
    const [registration] = await db
      .update(registrations)
      .set({ status, updatedAt: new Date() })
      .where(eq(registrations.id, id))
      .returning();
    return registration || undefined;
  }

  // Payment methods
  async getPayment(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByRegistration(registrationId: number): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.registrationId, registrationId));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePaymentStatus(id: number, status: Payment["status"], stripePaymentIntentId?: string): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({ 
        status, 
        stripePaymentIntentId,
        paidAt: status === "completed" ? new Date() : undefined
      })
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  // Schedule methods
  async getScheduleEvent(id: number): Promise<ScheduleEvent | undefined> {
    const [event] = await db.select().from(scheduleEvents).where(eq(scheduleEvents.id, id));
    return event || undefined;
  }

  async getScheduleEvents(from?: string, to?: string): Promise<ScheduleEvent[]> {
    let query = db.select().from(scheduleEvents);
    
    if (from && to) {
      query = query.where(and(
        gte(scheduleEvents.date, from),
        lte(scheduleEvents.date, to)
      )) as any;
    }
    
    return await query;
  }

  async createScheduleEvent(insertEvent: InsertScheduleEvent): Promise<ScheduleEvent> {
    // Build the title if not provided
    const title = insertEvent.title || `${insertEvent.eventType} - ${insertEvent.court}`;
    
    const [event] = await db
      .insert(scheduleEvents)
      .values({
        ...insertEvent,
        title
      })
      .returning();
    return event;
  }

  async updateScheduleEvent(id: number, eventUpdate: Partial<InsertScheduleEvent>): Promise<ScheduleEvent | undefined> {
    const [event] = await db
      .update(scheduleEvents)
      .set({ 
        ...eventUpdate, 
        updatedAt: new Date() 
      })
      .where(eq(scheduleEvents.id, id))
      .returning();
    return event || undefined;
  }

  async deleteScheduleEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(scheduleEvents)
      .where(eq(scheduleEvents.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async checkScheduleConflict(
    court: string, 
    date: string, 
    time: string, 
    duration: number = 120, 
    excludeId?: number
  ): Promise<boolean> {
    // Parse the time to calculate end time
    const [hours, minutes] = time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + duration;
    
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

    let query = db.select().from(scheduleEvents).where(
      and(
        eq(scheduleEvents.court, court),
        eq(scheduleEvents.date, date),
        excludeId ? ne(scheduleEvents.id, excludeId) : undefined
      )
    );

    const existingEvents = await query;
    
    // Check for time conflicts
    for (const event of existingEvents) {
      const [eventHours, eventMinutes] = event.time.split(':').map(Number);
      const eventStartMinutes = eventHours * 60 + eventMinutes;
      const eventEndMinutes = eventStartMinutes + event.duration;
      
      // Check if there's an overlap
      if (
        (startMinutes < eventEndMinutes && endMinutes > eventStartMinutes)
      ) {
        return true; // Conflict found
      }
    }
    
    return false; // No conflict
  }
}

export const storage = new DatabaseStorage();
