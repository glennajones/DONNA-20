import { 
  users, 
  registrations, 
  payments,
  scheduleEvents,
  players,
  parents,
  formTemplates,
  formResponses,
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
  eventRegistrations,

} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, ne, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
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
    return result.rowCount > 0;
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
        authorName: users.name
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
        authorName: users.name
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

  async getTodayTimeClockEntries(userId: number): Promise<TimeClockEntry[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return await db.select().from(timeClockEntries)
      .where(and(
        eq(timeClockEntries.userId, userId),
        gte(timeClockEntries.timestamp, startOfDay),
        lte(timeClockEntries.timestamp, endOfDay)
      ))
      .orderBy(timeClockEntries.timestamp);
  }

  async getAllTimeClockEntries(userId: number): Promise<TimeClockEntry[]> {
    return await db.select().from(timeClockEntries)
      .where(eq(timeClockEntries.userId, userId))
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
      .where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)));
    return registration || undefined;
  }

  async updateEventRegistrationStatus(registrationId: number, status: string): Promise<void> {
    await db
      .update(eventRegistrations)
      .set({ status: status as any })
      .where(eq(eventRegistrations.id, registrationId));
  }

}

export const storage = new DatabaseStorage();
