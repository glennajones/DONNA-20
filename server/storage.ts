import { 
  users, 
  registrations, 
  payments,
  scheduleEvents,
  players,
  parents,
  formTemplates,
  formResponses,
  reportTemplates,
  reportGenerations,
  events,
  campaigns,
  sponsors,
  evaluations,
  teamAssignments,
  googleCalendarTokens,
  calendarSyncLogs,
  podcastEpisodes,
  podcastComments,
  podcastPollVotes,
  timeClockEntries,
  practicePlans,
  coaches,
  coachOutreachLogs,
  documents,
  documentSignatures,
  documentAuditLogs,
  rolePermissions,
  dashboardWidgets,
  messageLogs,
  acknowledgements,
  coachResources,
  coachResourceFolders,
  coachTimeLogs,
  eventFeedback,
  simpleEvents,

  type User, 
  type InsertUser, 
  type Registration, 
  type InsertRegistration, 
  type Payment, 
  type InsertPayment,
  type ScheduleEvent,
  type InsertScheduleEvent,
  type Player,
  type InsertPlayer,
  type Parent,
  type InsertParent,
  type FormTemplate,
  type InsertFormTemplate,
  type FormResponse,
  type InsertFormResponse,
  type ReportTemplate,
  type InsertReportTemplate,
  type ReportGeneration,
  type InsertReportGeneration,
  type Event,
  type InsertEvent,
  type Campaign,
  type InsertCampaign,
  type Sponsor,
  type InsertSponsor,
  type Evaluation,
  type InsertEvaluation,
  type TeamAssignment,
  type GoogleCalendarToken,
  type InsertGoogleCalendarToken,
  type CalendarSyncLog,
  type PodcastEpisode,
  type InsertPodcastEpisode,
  type PodcastComment,
  type InsertPodcastComment,
  type PodcastPollVote,
  type InsertPodcastPollVote,
  type TimeClockEntry,
  type InsertTimeClockEntry,
  type PracticePlan,
  type InsertPracticePlan,
  type Coach,
  type InsertCoach,
  type CoachOutreachLog,
  type InsertCoachOutreachLog,
  type Document,
  type InsertDocument,
  type DocumentSignature,
  type InsertDocumentSignature,
  type DocumentAuditLog,
  type InsertDocumentAuditLog,
  type RolePermission,
  type InsertRolePermission,
  type DashboardWidget,
  type InsertDashboardWidget,
  type MessageLog,
  type InsertMessageLog,
  type Acknowledgement,
  type InsertAcknowledgement,
  type CoachResource,
  type InsertCoachResource,
  type CoachResourceFolder,
  type InsertCoachResourceFolder,
  type EventFeedback,
  type InsertEventFeedback,
  eventRegistrations,
  adminSettings,
  type AdminSettings,
  type InsertAdminSettings,
  type SimpleEvent,
  type InsertSimpleEvent,

} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ne, desc, or, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUsersByRoles(roles: string[]): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
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
  getScheduleEventsByEventName(eventName: string): Promise<ScheduleEvent[]>;
  createScheduleEvent(event: InsertScheduleEvent): Promise<ScheduleEvent>;
  updateScheduleEvent(id: number, event: Partial<InsertScheduleEvent>): Promise<ScheduleEvent | undefined>;
  deleteScheduleEvent(id: number): Promise<boolean>;
  checkScheduleConflict(court: string, date: string, time: string, duration: number, excludeId?: number): Promise<boolean>;
  
  // Player methods
  getPlayer(id: number): Promise<Player | undefined>;
  getPlayers(): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: number, player: Partial<InsertPlayer>): Promise<Player | undefined>;
  deletePlayer(id: number): Promise<boolean>;
  
  // Parent methods
  getParent(id: number): Promise<Parent | undefined>;
  getParents(): Promise<Parent[]>;
  createParent(parent: InsertParent): Promise<Parent>;
  updateParent(id: number, parent: Partial<InsertParent>): Promise<Parent | undefined>;
  deleteParent(id: number): Promise<boolean>;
  
  // Form Template methods
  getFormTemplate(id: number): Promise<FormTemplate | undefined>;
  getFormTemplates(): Promise<FormTemplate[]>;
  createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate>;
  deleteFormTemplate(id: number): Promise<boolean>;
  
  // Form Response methods
  getFormResponse(id: number): Promise<FormResponse | undefined>;
  getFormResponses(templateId: number): Promise<FormResponse[]>;
  createFormResponse(response: InsertFormResponse): Promise<FormResponse>;

  // Report Builder methods
  getReportTemplate(id: number): Promise<ReportTemplate | undefined>;
  getReportTemplates(): Promise<ReportTemplate[]>;
  createReportTemplate(template: InsertReportTemplate): Promise<ReportTemplate>;
  updateReportTemplate(id: number, template: Partial<InsertReportTemplate>): Promise<ReportTemplate | undefined>;
  deleteReportTemplate(id: number): Promise<boolean>;
  generateReport(templateId: number, userId: number, parameters: any): Promise<ReportGeneration>;

  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  getEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;

  // Campaign methods
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaigns(): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<InsertCampaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;

  // Sponsor methods
  getSponsor(id: number): Promise<Sponsor | undefined>;
  getSponsors(): Promise<Sponsor[]>;
  createSponsor(sponsor: InsertSponsor): Promise<Sponsor>;
  updateSponsor(id: number, sponsor: Partial<InsertSponsor>): Promise<Sponsor | undefined>;
  deleteSponsor(id: number): Promise<boolean>;

  // Performance Tracking methods
  getEvaluation(id: number): Promise<Evaluation | undefined>;
  getEvaluations(): Promise<Evaluation[]>;
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  
  getTeamAssignments(): Promise<TeamAssignment[]>;
  createTeamAssignments(assignments: Omit<TeamAssignment, 'id' | 'assignedAt'>[]): Promise<TeamAssignment[]>;

  // Google Calendar Integration methods
  getGoogleCalendarToken(userId: number): Promise<GoogleCalendarToken | undefined>;
  createGoogleCalendarToken(token: InsertGoogleCalendarToken): Promise<GoogleCalendarToken>;
  updateGoogleCalendarToken(userId: number, token: Partial<InsertGoogleCalendarToken>): Promise<GoogleCalendarToken | undefined>;
  deleteGoogleCalendarToken(userId: number): Promise<boolean>;
  
  createCalendarSyncLog(log: Omit<CalendarSyncLog, 'id' | 'syncedAt'>): Promise<CalendarSyncLog>;
  getCalendarSyncLogs(userId: number): Promise<CalendarSyncLog[]>;

  // Podcast methods
  getPodcastEpisode(id: number): Promise<PodcastEpisode | undefined>;
  getPodcastEpisodes(): Promise<PodcastEpisode[]>;
  createPodcastEpisode(episode: InsertPodcastEpisode): Promise<PodcastEpisode>;
  updatePodcastEpisode(id: number, episode: Partial<InsertPodcastEpisode>): Promise<PodcastEpisode | undefined>;
  deletePodcastEpisode(id: number): Promise<boolean>;

  getPodcastComment(id: number): Promise<(PodcastComment & { authorName: string }) | undefined>;
  getPodcastCommentsByEpisode(episodeId: number): Promise<(PodcastComment & { authorName: string })[]>;
  createPodcastComment(comment: InsertPodcastComment): Promise<PodcastComment>;
  deletePodcastComment(id: number): Promise<boolean>;

  getPodcastPollVote(episodeId: number, userId: number): Promise<PodcastPollVote | undefined>;
  createPodcastPollVote(vote: InsertPodcastPollVote): Promise<PodcastPollVote>;
  updatePodcastPollVote(episodeId: number, userId: number, vote: PodcastPollVote["vote"]): Promise<PodcastPollVote | undefined>;

  // Coach Resources methods
  createTimeClockEntry(entry: InsertTimeClockEntry): Promise<TimeClockEntry>;
  getTodayTimeClockEntries(userId: number): Promise<TimeClockEntry[]>;
  getAllTimeClockEntries(userId: number): Promise<TimeClockEntry[]>;
  
  getPracticePlans(): Promise<PracticePlan[]>;
  getPracticePlan(id: number): Promise<PracticePlan | undefined>;
  createPracticePlan(plan: InsertPracticePlan): Promise<PracticePlan>;
  updatePracticePlan(id: number, plan: Partial<InsertPracticePlan>): Promise<PracticePlan | undefined>;
  deletePracticePlan(id: number): Promise<boolean>;

  // Coach Matching methods
  getCoach(id: number): Promise<Coach | undefined>;
  getCoaches(): Promise<Coach[]>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(id: number, coach: Partial<InsertCoach>): Promise<Coach | undefined>;
  deleteCoach(id: number): Promise<boolean>;
  
  getCoachOutreachLog(id: number): Promise<CoachOutreachLog | undefined>;
  getCoachOutreachLogsByEvent(eventId: number): Promise<CoachOutreachLog[]>;
  createCoachOutreachLog(log: InsertCoachOutreachLog): Promise<CoachOutreachLog>;
  updateCoachOutreachLog(id: number, log: Partial<InsertCoachOutreachLog>): Promise<CoachOutreachLog | undefined>;
  deleteCoachOutreachLog(id: number): Promise<boolean>;

  // Document methods
  getDocument(id: number): Promise<Document | undefined>;
  getDocuments(): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;

  // Document Signature methods
  getDocumentSignature(id: number): Promise<DocumentSignature | undefined>;
  getDocumentSignatures(documentId: number): Promise<DocumentSignature[]>;
  createDocumentSignature(signature: InsertDocumentSignature): Promise<DocumentSignature>;
  getUserDocumentSignature(documentId: number, userId: number): Promise<DocumentSignature | undefined>;

  // Document Audit Log methods
  getDocumentAuditLogs(documentId: number): Promise<DocumentAuditLog[]>;
  createDocumentAuditLog(auditLog: InsertDocumentAuditLog): Promise<DocumentAuditLog>;

  // Event Registration methods
  createEventRegistration(registrationData: any): Promise<any>;
  getEventRegistrations(eventId: number): Promise<any[]>;
  getUserEventRegistration(eventId: number, userId: number): Promise<any>;
  updateEventRegistrationStatus(registrationId: number, status: string): Promise<void>;

  // Role Permissions methods
  getRolePermissions(role: string): Promise<RolePermission[]>;
  updateRolePermission(role: string, widgetId: number, canView: boolean, canManage: boolean): Promise<RolePermission>;
  createDefaultRolePermission(permission: InsertRolePermission): Promise<RolePermission>;

  // Message Logs methods
  createMessageLog(log: InsertMessageLog): Promise<MessageLog>;
  updateMessageLogStatus(id: number, status: MessageLog['status'], errorMessage?: string): Promise<MessageLog | undefined>;
  getMessageLogsByEvent(eventId: number): Promise<MessageLog[]>;
  updateMessageLogByMessageId(messageId: string, status: MessageLog['status']): Promise<void>;

  // Acknowledgements methods
  createAcknowledgement(ack: InsertAcknowledgement): Promise<Acknowledgement>;
  getAcknowledgementsByEvent(eventId: number): Promise<Acknowledgement[]>;
  getAcknowledgementByToken(token: string): Promise<Acknowledgement | undefined>;

  // Coach Resources methods
  getCoachResource(id: number): Promise<CoachResource | undefined>;
  getCoachResources(): Promise<CoachResource[]>;
  getCoachResourcesByCategory(category: string): Promise<CoachResource[]>;
  createCoachResource(resource: InsertCoachResource): Promise<CoachResource>;
  updateCoachResource(id: number, resource: Partial<InsertCoachResource>): Promise<CoachResource | undefined>;
  deleteCoachResource(id: number): Promise<boolean>;

  // Event Feedback methods
  createEventFeedback(feedback: InsertEventFeedback): Promise<EventFeedback>;
  getEventFeedback(eventId: number): Promise<EventFeedback[]>;
  getEventFeedbackByUser(eventId: number, userId: number): Promise<EventFeedback | undefined>;
  deleteEventFeedback(id: number): Promise<boolean>;

  // User role methods
  getUsersByRole(role: string): Promise<User[]>;

  // Admin Settings methods
  getAdminSettings(adminId: number): Promise<AdminSettings | undefined>;
  upsertAdminSettings(data: InsertAdminSettings): Promise<AdminSettings>;
  getAllAdminSettings(): Promise<AdminSettings[]>;

  // Simple Events methods
  getSimpleEvent(id: number): Promise<SimpleEvent | undefined>;
  getSimpleEvents(userId: number, userRole: string, from?: string, to?: string): Promise<SimpleEvent[]>;
  createSimpleEvent(event: InsertSimpleEvent): Promise<SimpleEvent>;
  updateSimpleEvent(id: number, event: Partial<InsertSimpleEvent>): Promise<SimpleEvent | undefined>;
  deleteSimpleEvent(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Helper method to generate unique username from name
  private async generateUniqueUsername(name: string): Promise<string> {
    const baseUsername = name.toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric characters
      .substring(0, 10); // Limit to 10 characters
    
    let username = baseUsername;
    let counter = 1;
    
    // Check if username exists and add number if needed
    while (await this.getUserByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }
    
    return username;
  }

  // Helper method to generate temporary password
  private generateTemporaryPassword(): string {
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
  }

  // Helper method to automatically create user account
  private async createUserAccount(name: string, email: string | null, role: "coach" | "player" | "parent" | "staff"): Promise<User | undefined> {
    try {
      const username = await this.generateUniqueUsername(name);
      const tempPassword = this.generateTemporaryPassword();
      
      const newUser = await this.createUser({
        name: name,
        username: username,
        password: tempPassword,
        role: role
      });
      
      console.log(`Auto-created user account: ${username} (temp password: ${tempPassword}) for ${name}`);
      return newUser;
    } catch (error) {
      console.error(`Failed to auto-create user account for ${name}:`, error);
      return undefined;
    }
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRoles(roles: string[]): Promise<User[]> {
    if (roles.length === 0) {
      return [];
    }
    
    const usersInRoles = await db.select()
      .from(users)
      .where(sql`${users.role} = ANY(${roles})`);
    
    return usersInRoles;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async updateUser(id: number, userUpdate: Partial<InsertUser>): Promise<User | undefined> {
    const updateData: any = { ...userUpdate };
    
    // Hash password if provided
    if (userUpdate.password) {
      updateData.password = await bcrypt.hash(userUpdate.password, 10);
    }

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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

  async getScheduleEventsByEventName(eventName: string): Promise<ScheduleEvent[]> {
    return await db.select().from(scheduleEvents).where(eq(scheduleEvents.title, eventName));
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

  // Player methods
  async getPlayer(id: number): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player || undefined;
  }

  async getPlayers(): Promise<Player[]> {
    return await db.select().from(players);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values(insertPlayer)
      .returning();
    
    // Automatically create user account for player
    await this.createUserAccount(player.name, player.contact, "player");
    
    return player;
  }

  async updatePlayer(id: number, playerUpdate: Partial<InsertPlayer>): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set({ ...playerUpdate, updatedAt: new Date() })
      .where(eq(players.id, id))
      .returning();
    return player || undefined;
  }

  async deletePlayer(id: number): Promise<boolean> {
    const result = await db.delete(players).where(eq(players.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Parent methods
  async getParent(id: number): Promise<Parent | undefined> {
    const [parent] = await db.select().from(parents).where(eq(parents.id, id));
    return parent || undefined;
  }

  async getParents(): Promise<Parent[]> {
    return await db.select().from(parents);
  }

  async createParent(insertParent: InsertParent): Promise<Parent> {
    const [parent] = await db
      .insert(parents)
      .values(insertParent)
      .returning();
    
    // Automatically create user account for parent
    if (parent.email) {
      await this.createUserAccount(parent.name, parent.email, "parent");
    }
    
    return parent;
  }

  async updateParent(id: number, parentUpdate: Partial<InsertParent>): Promise<Parent | undefined> {
    const [parent] = await db
      .update(parents)
      .set({ ...parentUpdate, updatedAt: new Date() })
      .where(eq(parents.id, id))
      .returning();
    return parent || undefined;
  }

  async deleteParent(id: number): Promise<boolean> {
    const result = await db.delete(parents).where(eq(parents.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Form Template methods
  async getFormTemplate(id: number): Promise<FormTemplate | undefined> {
    const [template] = await db.select().from(formTemplates).where(eq(formTemplates.id, id));
    return template || undefined;
  }

  async getFormTemplates(): Promise<FormTemplate[]> {
    return await db.select().from(formTemplates).where(eq(formTemplates.isActive, true)).orderBy(desc(formTemplates.createdAt));
  }

  async createFormTemplate(template: InsertFormTemplate): Promise<FormTemplate> {
    const [newTemplate] = await db
      .insert(formTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateFormTemplate(id: number, template: Partial<InsertFormTemplate>): Promise<FormTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(formTemplates)
      .set(template)
      .where(eq(formTemplates.id, id))
      .returning();
    return updatedTemplate || undefined;
  }

  async deleteFormTemplate(id: number): Promise<boolean> {
    const result = await db.update(formTemplates)
      .set({ isActive: false })
      .where(eq(formTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Form Response methods
  async getFormResponse(id: number): Promise<FormResponse | undefined> {
    const [response] = await db.select().from(formResponses).where(eq(formResponses.id, id));
    return response || undefined;
  }

  async getFormResponses(templateId: number): Promise<FormResponse[]> {
    return await db.select().from(formResponses)
      .where(eq(formResponses.templateId, templateId))
      .orderBy(desc(formResponses.submittedAt));
  }

  async createFormResponse(response: InsertFormResponse): Promise<FormResponse> {
    const [newResponse] = await db
      .insert(formResponses)
      .values(response)
      .returning();
    return newResponse;
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.createdAt));
  }

  async getEventsByParentId(parentId: number): Promise<Event[]> {
    return await db.select().from(events)
      .where(or(eq(events.id, parentId), eq(events.parentEventId, parentId)))
      .orderBy(desc(events.createdAt));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async updateEvent(id: number, eventUpdate: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({ ...eventUpdate, updatedAt: new Date() })
      .where(eq(events.id, id))
      .returning();
    return event || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Campaign methods
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async updateCampaign(id: number, campaignUpdate: Partial<InsertCampaign>): Promise<Campaign | undefined> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...campaignUpdate, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign || undefined;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const result = await db.delete(campaigns).where(eq(campaigns.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Sponsor methods
  async getSponsor(id: number): Promise<Sponsor | undefined> {
    const [sponsor] = await db.select().from(sponsors).where(eq(sponsors.id, id));
    return sponsor || undefined;
  }

  async getSponsors(): Promise<Sponsor[]> {
    return await db.select().from(sponsors).orderBy(desc(sponsors.createdAt));
  }

  async createSponsor(insertSponsor: InsertSponsor): Promise<Sponsor> {
    const [sponsor] = await db
      .insert(sponsors)
      .values(insertSponsor)
      .returning();
    return sponsor;
  }

  async updateSponsor(id: number, sponsorUpdate: Partial<InsertSponsor>): Promise<Sponsor | undefined> {
    const [sponsor] = await db
      .update(sponsors)
      .set({ ...sponsorUpdate, updatedAt: new Date() })
      .where(eq(sponsors.id, id))
      .returning();
    return sponsor || undefined;
  }

  async deleteSponsor(id: number): Promise<boolean> {
    const result = await db.delete(sponsors).where(eq(sponsors.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Performance Tracking methods
  async getEvaluation(id: number): Promise<Evaluation | undefined> {
    const [evaluation] = await db.select().from(evaluations).where(eq(evaluations.id, id));
    return evaluation || undefined;
  }

  async getEvaluations(): Promise<Evaluation[]> {
    return await db.select().from(evaluations).orderBy(desc(evaluations.createdAt));
  }

  async createEvaluation(insertEvaluation: InsertEvaluation): Promise<Evaluation> {
    // Calculate composite score based on scores and weights
    const scores = {
      serving: insertEvaluation.serving,
      serveReceive: insertEvaluation.serveReceive,
      setting: insertEvaluation.setting,
      blocking: insertEvaluation.blocking,
      attacking: insertEvaluation.attacking,
      leadership: insertEvaluation.leadership,
      communication: insertEvaluation.communication,
      coachability: insertEvaluation.coachability,
    };
    
    const weights = insertEvaluation.weights as any;
    let totalWeighted = 0;
    let totalWeight = 0;
    
    Object.entries(scores).forEach(([category, score]) => {
      const weight = weights[category] || 1;
      totalWeighted += score * weight;
      totalWeight += weight;
    });
    
    const compositeScore = totalWeight > 0 ? totalWeighted / totalWeight : 0;
    
    const [evaluation] = await db
      .insert(evaluations)
      .values({
        ...insertEvaluation,
        compositeScore: compositeScore.toString(),
      })
      .returning();
    return evaluation;
  }

  async getTeamAssignments(): Promise<TeamAssignment[]> {
    return await db.select().from(teamAssignments).orderBy(desc(teamAssignments.assignedAt));
  }

  async createTeamAssignments(assignments: Omit<TeamAssignment, 'id' | 'assignedAt'>[]): Promise<TeamAssignment[]> {
    const results = [];
    for (const assignment of assignments) {
      const [teamAssignment] = await db
        .insert(teamAssignments)
        .values(assignment)
        .returning();
      results.push(teamAssignment);
    }
    return results;
  }

  // Google Calendar Integration methods
  async getGoogleCalendarToken(userId: number): Promise<GoogleCalendarToken | undefined> {
    const [token] = await db.select().from(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
    return token || undefined;
  }

  async createGoogleCalendarToken(insertToken: InsertGoogleCalendarToken): Promise<GoogleCalendarToken> {
    const [token] = await db
      .insert(googleCalendarTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  async updateGoogleCalendarToken(userId: number, tokenUpdate: Partial<InsertGoogleCalendarToken>): Promise<GoogleCalendarToken | undefined> {
    const [token] = await db
      .update(googleCalendarTokens)
      .set({ ...tokenUpdate, updatedAt: new Date() })
      .where(eq(googleCalendarTokens.userId, userId))
      .returning();
    return token || undefined;
  }

  async deleteGoogleCalendarToken(userId: number): Promise<boolean> {
    const result = await db.delete(googleCalendarTokens).where(eq(googleCalendarTokens.userId, userId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async createCalendarSyncLog(log: Omit<CalendarSyncLog, 'id' | 'syncedAt'>): Promise<CalendarSyncLog> {
    const [syncLog] = await db
      .insert(calendarSyncLogs)
      .values(log)
      .returning();
    return syncLog;
  }

  async getCalendarSyncLogs(userId: number): Promise<CalendarSyncLog[]> {
    return await db.select().from(calendarSyncLogs)
      .where(eq(calendarSyncLogs.userId, userId))
      .orderBy(desc(calendarSyncLogs.syncedAt));
  }

  // Podcast methods
  async getPodcastEpisode(id: number): Promise<PodcastEpisode | undefined> {
    const [episode] = await db.select().from(podcastEpisodes).where(eq(podcastEpisodes.id, id));
    return episode || undefined;
  }

  async getPodcastEpisodes(): Promise<PodcastEpisode[]> {
    return await db.select().from(podcastEpisodes)
      .where(eq(podcastEpisodes.status, 'published'))
      .orderBy(desc(podcastEpisodes.publishedAt));
  }

  async createPodcastEpisode(insertEpisode: InsertPodcastEpisode): Promise<PodcastEpisode> {
    const [episode] = await db
      .insert(podcastEpisodes)
      .values(insertEpisode)
      .returning();
    return episode;
  }

  async updatePodcastEpisode(id: number, episodeUpdate: Partial<InsertPodcastEpisode>): Promise<PodcastEpisode | undefined> {
    const [episode] = await db
      .update(podcastEpisodes)
      .set({ ...episodeUpdate, updatedAt: new Date() })
      .where(eq(podcastEpisodes.id, id))
      .returning();
    return episode || undefined;
  }

  async deletePodcastEpisode(id: number): Promise<boolean> {
    const result = await db.delete(podcastEpisodes).where(eq(podcastEpisodes.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPodcastComment(id: number): Promise<(PodcastComment & { authorName: string }) | undefined> {
    const result = await db
      .select({
        id: podcastComments.id,
        episodeId: podcastComments.episodeId,
        userId: podcastComments.userId,
        content: podcastComments.content,
        createdAt: podcastComments.createdAt,
        authorName: sql<string>`COALESCE(${users.name}, 'Unknown User')`
      })
      .from(podcastComments)
      .leftJoin(users, eq(podcastComments.userId, users.id))
      .where(eq(podcastComments.id, id));
    
    return result[0] || undefined;
  }

  async getPodcastCommentsByEpisode(episodeId: number): Promise<(PodcastComment & { authorName: string })[]> {
    const result = await db
      .select({
        id: podcastComments.id,
        episodeId: podcastComments.episodeId,
        userId: podcastComments.userId,
        content: podcastComments.content,
        createdAt: podcastComments.createdAt,
        authorName: sql<string>`COALESCE(${users.name}, 'Unknown User')`
      })
      .from(podcastComments)
      .leftJoin(users, eq(podcastComments.userId, users.id))
      .where(eq(podcastComments.episodeId, episodeId))
      .orderBy(desc(podcastComments.createdAt));
    
    return result;
  }

  async createPodcastComment(insertComment: InsertPodcastComment): Promise<PodcastComment> {
    const [comment] = await db
      .insert(podcastComments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async deletePodcastComment(id: number): Promise<boolean> {
    const result = await db.delete(podcastComments).where(eq(podcastComments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getPodcastPollVote(episodeId: number, userId: number): Promise<PodcastPollVote | undefined> {
    const [vote] = await db.select().from(podcastPollVotes)
      .where(and(eq(podcastPollVotes.episodeId, episodeId), eq(podcastPollVotes.userId, userId)));
    return vote || undefined;
  }

  async createPodcastPollVote(insertVote: InsertPodcastPollVote): Promise<PodcastPollVote> {
    const [vote] = await db
      .insert(podcastPollVotes)
      .values(insertVote)
      .returning();
    return vote;
  }

  async updatePodcastPollVote(episodeId: number, userId: number, voteValue: PodcastPollVote["vote"]): Promise<PodcastPollVote | undefined> {
    const [vote] = await db
      .update(podcastPollVotes)
      .set({ vote: voteValue })
      .where(and(eq(podcastPollVotes.episodeId, episodeId), eq(podcastPollVotes.userId, userId)))
      .returning();
    return vote || undefined;
  }

  // Coach Resources methods
  async createTimeClockEntry(insertEntry: InsertTimeClockEntry): Promise<TimeClockEntry> {
    const [entry] = await db
      .insert(timeClockEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async getPendingTimeClockEntries(): Promise<TimeClockEntry[]> {
    return await db.select().from(timeClockEntries)
      .where(and(
        eq(timeClockEntries.isManual, true),
        eq(timeClockEntries.status, 'pending')
      ))
      .orderBy(desc(timeClockEntries.createdAt));
  }

  async approveTimeClockEntry(entryId: number, adminUserId: number): Promise<TimeClockEntry | undefined> {
    const [entry] = await db
      .update(timeClockEntries)
      .set({
        status: 'approved',
        approvedBy: adminUserId,
        approvedAt: new Date()
      })
      .where(eq(timeClockEntries.id, entryId))
      .returning();
    return entry;
  }

  async rejectTimeClockEntry(entryId: number, adminUserId: number): Promise<TimeClockEntry | undefined> {
    const [entry] = await db
      .update(timeClockEntries)
      .set({
        status: 'rejected',
        approvedBy: adminUserId,
        approvedAt: new Date()
      })
      .where(eq(timeClockEntries.id, entryId))
      .returning();
    return entry;
  }

  async getTodayTimeClockEntries(userId: number): Promise<TimeClockEntry[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return await db.select().from(timeClockEntries)
      .where(and(
        eq(timeClockEntries.userId, userId),
        gte(timeClockEntries.timestamp, startOfDay),
        lte(timeClockEntries.timestamp, endOfDay),
        eq(timeClockEntries.status, 'approved')
      ))
      .orderBy(timeClockEntries.timestamp);
  }

  async getAllTimeClockEntries(userId: number): Promise<TimeClockEntry[]> {
    return await db.select().from(timeClockEntries)
      .where(and(
        eq(timeClockEntries.userId, userId),
        eq(timeClockEntries.status, 'approved')
      ))
      .orderBy(desc(timeClockEntries.timestamp));
  }

  async getPracticePlans(): Promise<PracticePlan[]> {
    return await db.select().from(practicePlans).orderBy(desc(practicePlans.createdAt));
  }

  async getPracticePlan(id: number): Promise<PracticePlan | undefined> {
    const [plan] = await db.select().from(practicePlans).where(eq(practicePlans.id, id));
    return plan || undefined;
  }

  async createPracticePlan(insertPlan: InsertPracticePlan): Promise<PracticePlan> {
    const [plan] = await db
      .insert(practicePlans)
      .values(insertPlan)
      .returning();
    return plan;
  }

  async updatePracticePlan(id: number, planData: Partial<InsertPracticePlan>): Promise<PracticePlan | undefined> {
    const [plan] = await db
      .update(practicePlans)
      .set({ ...planData, updatedAt: new Date() })
      .where(eq(practicePlans.id, id))
      .returning();
    return plan || undefined;
  }

  async deletePracticePlan(id: number): Promise<boolean> {
    const result = await db.delete(practicePlans).where(eq(practicePlans.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Coach Matching methods
  async getCoach(id: number): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.id, id));
    return coach || undefined;
  }

  async getCoaches(): Promise<Coach[]> {
    return await db.select().from(coaches);
  }

  async createCoach(insertCoach: InsertCoach): Promise<Coach> {
    const [coach] = await db
      .insert(coaches)
      .values(insertCoach)
      .returning();
    
    // Automatically create user account for coach
    await this.createUserAccount(coach.name, coach.email, "coach");
    
    return coach;
  }

  async updateCoach(id: number, coachUpdate: Partial<InsertCoach>): Promise<Coach | undefined> {
    const [coach] = await db
      .update(coaches)
      .set({ ...coachUpdate, updatedAt: new Date() })
      .where(eq(coaches.id, id))
      .returning();
    return coach || undefined;
  }

  async deleteCoach(id: number): Promise<boolean> {
    const result = await db.delete(coaches).where(eq(coaches.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getCoachOutreachLog(id: number): Promise<CoachOutreachLog | undefined> {
    const [log] = await db.select().from(coachOutreachLogs).where(eq(coachOutreachLogs.id, id));
    return log || undefined;
  }

  async getCoachOutreachLogsByEvent(eventId: number): Promise<CoachOutreachLog[]> {
    return await db.select().from(coachOutreachLogs).where(eq(coachOutreachLogs.eventId, eventId));
  }

  async createCoachOutreachLog(insertLog: InsertCoachOutreachLog): Promise<CoachOutreachLog> {
    const [log] = await db
      .insert(coachOutreachLogs)
      .values(insertLog)
      .returning();
    return log;
  }

  async updateCoachOutreachLog(id: number, logUpdate: Partial<InsertCoachOutreachLog>): Promise<CoachOutreachLog | undefined> {
    const [log] = await db
      .update(coachOutreachLogs)
      .set(logUpdate)
      .where(eq(coachOutreachLogs.id, id))
      .returning();
    return log || undefined;
  }

  async deleteCoachOutreachLog(id: number): Promise<boolean> {
    const result = await db.delete(coachOutreachLogs).where(eq(coachOutreachLogs.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Document methods
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async getDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.createdAt));
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: number, documentUpdate: Partial<InsertDocument>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ ...documentUpdate, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Document Signature methods
  async getDocumentSignature(id: number): Promise<DocumentSignature | undefined> {
    const [signature] = await db.select().from(documentSignatures).where(eq(documentSignatures.id, id));
    return signature || undefined;
  }

  async getDocumentSignatures(documentId: number): Promise<DocumentSignature[]> {
    return await db.select().from(documentSignatures).where(eq(documentSignatures.documentId, documentId));
  }

  async createDocumentSignature(insertSignature: InsertDocumentSignature): Promise<DocumentSignature> {
    const [signature] = await db
      .insert(documentSignatures)
      .values(insertSignature)
      .returning();
    return signature;
  }

  async getUserDocumentSignature(documentId: number, userId: number): Promise<DocumentSignature | undefined> {
    const [signature] = await db
      .select()
      .from(documentSignatures)
      .where(and(eq(documentSignatures.documentId, documentId), eq(documentSignatures.userId, userId)));
    return signature || undefined;
  }

  // Document Audit Log methods
  async getDocumentAuditLogs(documentId: number): Promise<DocumentAuditLog[]> {
    return await db
      .select()
      .from(documentAuditLogs)
      .where(eq(documentAuditLogs.documentId, documentId))
      .orderBy(desc(documentAuditLogs.timestamp));
  }

  async createDocumentAuditLog(insertAuditLog: InsertDocumentAuditLog): Promise<DocumentAuditLog> {
    const [auditLog] = await db
      .insert(documentAuditLogs)
      .values(insertAuditLog)
      .returning();
    return auditLog;
  }

  // Event Registration methods
  async createEventRegistration(registrationData: any): Promise<any> {
    const [registration] = await db
      .insert(eventRegistrations)
      .values(registrationData)
      .returning();
    return registration;
  }

  async getEventRegistrations(eventId: number): Promise<any[]> {
    return await db
      .select()
      .from(eventRegistrations)
      .where(eq(eventRegistrations.eventId, eventId));
  }

  async getUserEventRegistration(eventId: number, userId: number): Promise<any> {
    const [registration] = await db
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.registeredBy, userId)));
    return registration || undefined;
  }

  async updateEventRegistrationStatus(registrationId: number, status: string): Promise<void> {
    await db
      .update(eventRegistrations)
      .set({ status: status as any })
      .where(eq(eventRegistrations.id, registrationId));
  }

  // Report Builder methods
  async getReportTemplate(id: number): Promise<ReportTemplate | undefined> {
    const [template] = await db.select().from(reportTemplates).where(eq(reportTemplates.id, id));
    return template || undefined;
  }

  async getReportTemplates(): Promise<ReportTemplate[]> {
    return await db.select().from(reportTemplates)
      .where(eq(reportTemplates.isActive, true))
      .orderBy(desc(reportTemplates.createdAt));
  }

  async createReportTemplate(insertTemplate: InsertReportTemplate): Promise<ReportTemplate> {
    const [template] = await db
      .insert(reportTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateReportTemplate(id: number, templateUpdate: Partial<InsertReportTemplate>): Promise<ReportTemplate | undefined> {
    const [template] = await db
      .update(reportTemplates)
      .set({ ...templateUpdate, updatedAt: new Date() })
      .where(eq(reportTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteReportTemplate(id: number): Promise<boolean> {
    // Soft delete by setting isActive to false
    const result = await db
      .update(reportTemplates)
      .set({ isActive: false })
      .where(eq(reportTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async generateReport(templateId: number, userId: number, parameters: any): Promise<ReportGeneration> {
    // Mock implementation for now - in production this would:
    // 1. Fetch the template
    // 2. Query the data source based on template configuration
    // 3. Generate PDF/CSV files
    // 4. Store files and return URLs
    
    const template = await this.getReportTemplate(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const mockUrls = {
      pdf: `/api/reports/downloads/${templateId}-${Date.now()}.pdf`,
      csv: `/api/reports/downloads/${templateId}-${Date.now()}.csv`
    };

    const [generation] = await db
      .insert(reportGenerations)
      .values({
        templateId,
        generatedBy: userId,
        status: 'completed',
        parameters,
        outputUrls: mockUrls,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      })
      .returning();

    return generation;
  }

  // Role Permissions methods
  async getRolePermissions(role: string): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).where(eq(rolePermissions.role, role));
  }

  async updateRolePermission(role: string, widgetId: number, canView: boolean, canManage: boolean): Promise<RolePermission> {
    // Try to update existing permission first
    const existing = await db.select().from(rolePermissions)
      .where(and(eq(rolePermissions.role, role), eq(rolePermissions.widgetId, widgetId)));

    if (existing.length > 0) {
      // Update existing permission
      const [updated] = await db.update(rolePermissions)
        .set({ canView, canManage })
        .where(and(eq(rolePermissions.role, role), eq(rolePermissions.widgetId, widgetId)))
        .returning();
      return updated;
    } else {
      // Create new permission
      const [created] = await db.insert(rolePermissions)
        .values({ role, widgetId, canView, canManage })
        .returning();
      return created;
    }
  }

  async createDefaultRolePermission(permission: InsertRolePermission): Promise<RolePermission> {
    const [created] = await db.insert(rolePermissions)
      .values(permission)
      .returning();
    return created;
  }

  // Subscription Management Methods
  async updateUserStripeInfo(userId: number, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ 
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: stripeSubscriptionId ? "active" : "inactive",
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async updateUserSubscriptionStatus(userId: number, status: string, plan?: string): Promise<User> {
    const [updated] = await db.update(users)
      .set({ 
        subscriptionStatus: status as any,
        subscriptionPlan: plan,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, stripeCustomerId));
    return user || null;
  }

  async getActiveSubscribers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.subscriptionStatus, "active"));
  }

  // Message Logs methods
  async createMessageLog(log: InsertMessageLog): Promise<MessageLog> {
    const [created] = await db.insert(messageLogs)
      .values(log)
      .returning();
    return created;
  }

  async updateMessageLogStatus(id: number, status: MessageLog['status'], errorMessage?: string): Promise<MessageLog | undefined> {
    const [updated] = await db.update(messageLogs)
      .set({ status, errorMessage })
      .where(eq(messageLogs.id, id))
      .returning();
    return updated;
  }

  async getMessageLogsByEvent(eventId: number): Promise<MessageLog[]> {
    return await db.select().from(messageLogs)
      .where(eq(messageLogs.eventId, eventId))
      .orderBy(desc(messageLogs.timestamp));
  }

  async updateMessageLogByMessageId(messageId: string, status: MessageLog['status']): Promise<void> {
    await db.update(messageLogs)
      .set({ status })
      .where(eq(messageLogs.messageId, messageId));
  }

  // Acknowledgements methods
  async createAcknowledgement(ack: InsertAcknowledgement): Promise<Acknowledgement> {
    const [created] = await db.insert(acknowledgements)
      .values(ack)
      .returning();
    return created;
  }

  async getAcknowledgementsByEvent(eventId: number): Promise<Acknowledgement[]> {
    return await db.select().from(acknowledgements)
      .where(eq(acknowledgements.eventId, eventId))
      .orderBy(desc(acknowledgements.acknowledgedAt));
  }

  async getAcknowledgementByToken(token: string): Promise<Acknowledgement | undefined> {
    const [acknowledgement] = await db.select().from(acknowledgements)
      .where(eq(acknowledgements.token, token));
    return acknowledgement;
  }

  // Coach Resource Folders methods
  async getCoachResourceFolder(id: number): Promise<CoachResourceFolder | undefined> {
    const [folder] = await db.select().from(coachResourceFolders)
      .where(eq(coachResourceFolders.id, id));
    return folder;
  }

  async getCoachResourceFolders(parentId?: number): Promise<CoachResourceFolder[]> {
    if (parentId === undefined) {
      return await db.select().from(coachResourceFolders)
        .where(sql`${coachResourceFolders.parentId} IS NULL`)
        .orderBy(coachResourceFolders.name);
    }
    return await db.select().from(coachResourceFolders)
      .where(eq(coachResourceFolders.parentId, parentId))
      .orderBy(coachResourceFolders.name);
  }

  async getCoachResourceFoldersByCategory(category: string): Promise<CoachResourceFolder[]> {
    return await db.select().from(coachResourceFolders)
      .where(eq(coachResourceFolders.category, category))
      .orderBy(coachResourceFolders.name);
  }

  async createCoachResourceFolder(folder: InsertCoachResourceFolder): Promise<CoachResourceFolder> {
    const [created] = await db.insert(coachResourceFolders)
      .values(folder)
      .returning();
    return created;
  }

  async updateCoachResourceFolder(id: number, folder: Partial<InsertCoachResourceFolder>): Promise<CoachResourceFolder | undefined> {
    const [updated] = await db.update(coachResourceFolders)
      .set({ ...folder, updatedAt: new Date() })
      .where(eq(coachResourceFolders.id, id))
      .returning();
    return updated;
  }

  async deleteCoachResourceFolder(id: number): Promise<boolean> {
    // First delete all resources in this folder
    await db.delete(coachResources)
      .where(eq(coachResources.folderId, id));
    
    // Then delete the folder
    const result = await db.delete(coachResourceFolders)
      .where(eq(coachResourceFolders.id, id));
    return result.rowCount > 0;
  }

  // Coach Resources methods (Enhanced with folder support)
  async getCoachResource(id: number): Promise<CoachResource | undefined> {
    const [resource] = await db.select().from(coachResources)
      .where(eq(coachResources.id, id));
    return resource;
  }

  async getCoachResources(folderId?: number): Promise<CoachResource[]> {
    if (folderId === undefined) {
      return await db.select().from(coachResources)
        .orderBy(desc(coachResources.uploadedAt));
    }
    return await db.select().from(coachResources)
      .where(eq(coachResources.folderId, folderId))
      .orderBy(desc(coachResources.uploadedAt));
  }

  async getCoachResourcesByCategory(category: string): Promise<CoachResource[]> {
    return await db.select().from(coachResources)
      .where(eq(coachResources.category, category))
      .orderBy(desc(coachResources.uploadedAt));
  }

  async getCoachResourcesByFolder(folderId: number): Promise<CoachResource[]> {
    return await db.select().from(coachResources)
      .where(eq(coachResources.folderId, folderId))
      .orderBy(desc(coachResources.uploadedAt));
  }

  async createCoachResource(resource: InsertCoachResource): Promise<CoachResource> {
    const [created] = await db.insert(coachResources)
      .values(resource)
      .returning();
    return created;
  }

  async updateCoachResource(id: number, resource: Partial<InsertCoachResource>): Promise<CoachResource | undefined> {
    const [updated] = await db.update(coachResources)
      .set({ ...resource, updatedAt: new Date() })
      .where(eq(coachResources.id, id))
      .returning();
    return updated;
  }

  async deleteCoachResource(id: number): Promise<boolean> {
    const result = await db.delete(coachResources)
      .where(eq(coachResources.id, id));
    return result.rowCount > 0;
  }

  // Event Feedback Methods
  async createEventFeedback(feedback: InsertEventFeedback): Promise<EventFeedback> {
    const [created] = await db.insert(eventFeedback).values(feedback).returning();
    return created;
  }

  async getEventFeedback(eventId: number): Promise<EventFeedback[]> {
    return db.select().from(eventFeedback)
      .where(eq(eventFeedback.eventId, eventId))
      .orderBy(desc(eventFeedback.submittedAt));
  }

  async getEventFeedbackByUser(eventId: number, userId: number): Promise<EventFeedback | undefined> {
    const [feedback] = await db.select().from(eventFeedback)
      .where(and(
        eq(eventFeedback.eventId, eventId),
        eq(eventFeedback.userId, userId)
      ));
    return feedback;
  }

  async deleteEventFeedback(id: number): Promise<boolean> {
    const result = await db.delete(eventFeedback)
      .where(eq(eventFeedback.id, id));
    return result.rowCount > 0;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  }

  // Admin Settings methods
  async getAdminSettings(adminId: number): Promise<AdminSettings | undefined> {
    const [settings] = await db.select().from(adminSettings).where(eq(adminSettings.adminId, adminId));
    return settings;
  }

  async upsertAdminSettings(data: InsertAdminSettings): Promise<AdminSettings> {
    const existing = await this.getAdminSettings(data.adminId);
    
    if (existing) {
      const [updated] = await db.update(adminSettings)
        .set({ 
          dailyEmailEnabled: data.dailyEmailEnabled,
          dailyEmailTime: data.dailyEmailTime,
          updatedAt: new Date()
        })
        .where(eq(adminSettings.adminId, data.adminId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(adminSettings).values(data).returning();
      return created;
    }
  }

  async getAllAdminSettings(): Promise<AdminSettings[]> {
    return db.select().from(adminSettings);
  }

  // Permissions Matrix methods
  async getPermissionsMatrix(): Promise<any[]> {
    return db.select().from(rolePermissions);
  }

  async savePermissionsMatrix(permissions: any[]): Promise<void> {
    // Clear existing permissions and insert new ones
    await db.delete(rolePermissions);
    if (permissions.length > 0) {
      await db.insert(rolePermissions).values(permissions);
    }
  }

  async checkPermission(role: string, page: string, action: 'canView' | 'canEdit' | 'canDelete' | 'canCreate'): Promise<boolean> {
    const result = await db.select()
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.role, role),
          eq(rolePermissions.page, page)
        )
      )
      .limit(1);
    
    if (result.length === 0) {
      // Default permissions: admin can do everything, others can only view
      return role === 'admin' || (action === 'canView' && ['manager', 'coach'].includes(role));
    }
    
    return result[0][action] || false;
  }

  // Coach Time Logs methods
  async createCoachTimeLog(timeLogData: InsertCoachTimeLog): Promise<CoachTimeLog> {
    const [timeLog] = await db.insert(coachTimeLogs).values(timeLogData).returning();
    return timeLog;
  }

  async getCoachTimeLogs(): Promise<CoachTimeLog[]> {
    return db.select().from(coachTimeLogs).orderBy(desc(coachTimeLogs.submittedAt));
  }

  async getCoachTimeLogsByCoachId(coachId: number): Promise<CoachTimeLog[]> {
    return db.select()
      .from(coachTimeLogs)
      .where(eq(coachTimeLogs.coachId, coachId))
      .orderBy(desc(coachTimeLogs.submittedAt));
  }

  async getPendingCoachTimeLogs(): Promise<CoachTimeLog[]> {
    return db.select()
      .from(coachTimeLogs)
      .where(eq(coachTimeLogs.approved, false))
      .orderBy(desc(coachTimeLogs.submittedAt));
  }

  async approveCoachTimeLog(id: number, approvedBy: number): Promise<CoachTimeLog | undefined> {
    const [timeLog] = await db.update(coachTimeLogs)
      .set({ 
        approved: true, 
        approvedAt: new Date(),
        approvedBy: approvedBy
      })
      .where(eq(coachTimeLogs.id, id))
      .returning();
    return timeLog || undefined;
  }

  async deleteCoachTimeLog(id: number): Promise<boolean> {
    const result = await db.delete(coachTimeLogs).where(eq(coachTimeLogs.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Simple Events methods
  async getSimpleEvent(id: number): Promise<SimpleEvent | undefined> {
    const [event] = await db.select().from(simpleEvents).where(eq(simpleEvents.id, id));
    return event || undefined;
  }

  async getSimpleEvents(userId: number, userRole: string, from?: string, to?: string): Promise<SimpleEvent[]> {
    let query = db.select().from(simpleEvents);
    
    // Apply date filtering if provided
    if (from && to) {
      query = query.where(
        and(
          gte(simpleEvents.startTime, new Date(from)),
          lte(simpleEvents.startTime, new Date(to))
        )
      );
    }

    const allEvents = await query.orderBy(simpleEvents.startTime);
    
    // Filter based on visibility rules
    return allEvents.filter(event => {
      // Creator can always see their own events
      if (event.createdBy === userId) {
        return true;
      }
      
      // Check role-based visibility
      if (event.visibleToRoles.includes(userRole)) {
        return true;
      }
      
      // Check individual user visibility
      if (event.visibleToUsers.includes(userId.toString())) {
        return true;
      }
      
      return false;
    });
  }

  async createSimpleEvent(event: InsertSimpleEvent): Promise<SimpleEvent> {
    const [createdEvent] = await db.insert(simpleEvents).values(event).returning();
    return createdEvent;
  }

  async updateSimpleEvent(id: number, event: Partial<InsertSimpleEvent>): Promise<SimpleEvent | undefined> {
    const [updatedEvent] = await db
      .update(simpleEvents)
      .set({ ...event, updatedAt: new Date() })
      .where(eq(simpleEvents.id, id))
      .returning();
    return updatedEvent || undefined;
  }

  async deleteSimpleEvent(id: number): Promise<boolean> {
    const result = await db.delete(simpleEvents).where(eq(simpleEvents.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

}

export const storage = new DatabaseStorage();
