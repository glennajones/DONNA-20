import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "manager", "coach", "player", "parent", "staff"] }).notNull(),
  email: text("email"),
  phone: text("phone"),
  communicationPreference: text("communication_preference", { enum: ["Email", "SMS", "GroupMe", "Email + SMS", "Email + GroupMe", "SMS + GroupMe", "All"] }).default("Email"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status", { enum: ["active", "inactive", "past_due", "canceled", "trialing"] }).default("inactive"),
  subscriptionPlan: text("subscription_plan"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  playerType: text("player_type", { enum: ["player", "parent"] }).notNull(),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  medicalInfo: text("medical_info"),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  registrationFee: decimal("registration_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id").references(() => registrations.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status", { enum: ["pending", "completed", "failed", "refunded"] }).notNull().default("pending"),
  paymentMethod: text("payment_method", { enum: ["card", "cash", "bank_transfer"] }).notNull(),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const scheduleEvents = pgTable("schedule_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  court: text("court").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  time: text("time").notNull(), // HH:MM format
  duration: integer("duration").notNull().default(120), // minutes
  eventType: text("event_type", { enum: ["training", "match", "tournament", "practice"] }).notNull(),
  participants: text("participants").array().notNull().default([]),
  coach: text("coach"),
  description: text("description"),
  status: text("status", { enum: ["scheduled", "in_progress", "completed", "cancelled"] }).notNull().default("scheduled"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(), // YYYY-MM-DD format
  contact: text("contact"), // email
  phone: text("phone"), // phone number
  photo: text("photo"), // profile photo URL
  communicationPreference: text("communication_preference", { enum: ["Email", "SMS", "GroupMe"] }).notNull().default("Email"), // single choice
  teams: text("teams").array().notNull().default([]), // team assignments
  status: text("status", { enum: ["active", "inactive", "suspended"] }).notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  communicationPreference: text("communication_preference", { enum: ["Email", "SMS", "GroupMe"] }).default("Email"),
  children: integer("children").array().notNull().default([]), // array of player IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  role: true,
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  contact: z.string().optional(),
});

export const insertParentSchema = createInsertSchema(parents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email().optional(),
});

// Relations
export const playersRelations = relations(players, ({ many }) => ({
  parentChildren: many(parents),
}));

export const parentsRelations = relations(parents, ({ many }) => ({
  children: many(players),
}));

// Type exports
export type Player = typeof players.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Parent = typeof parents.$inferSelect;
export type InsertParent = z.infer<typeof insertParentSchema>;

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  paidAt: true,
});

export const insertScheduleEventSchema = createInsertSchema(scheduleEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  title: z.string().min(1, "Title is required"),
  court: z.string().min(1, "Court is required"),
  eventType: z.enum(["training", "match", "tournament", "practice"]),
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginRequest = z.infer<typeof loginSchema>;

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type ScheduleEvent = typeof scheduleEvents.$inferSelect;
export type InsertScheduleEvent = z.infer<typeof insertScheduleEventSchema>;

// Communication preferences type
export type CommunicationPreference = "Email" | "SMS" | "GroupMe";

// Form Builder Schema
export const formTemplates = pgTable("form_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  fields: json("fields").notNull(),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const formResponses = pgTable("form_responses", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => formTemplates.id).notNull(),
  responderId: integer("responder_id").references(() => players.id),
  responderName: varchar("responder_name", { length: 100 }).notNull(),
  responderEmail: varchar("responder_email", { length: 100 }),
  answers: json("answers").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  status: varchar("status", { length: 20 }).default("completed").notNull(),
});

// Types for form templates
export const insertFormTemplateSchema = createInsertSchema(formTemplates).omit({
  id: true,
  createdAt: true,
});
export type InsertFormTemplate = z.infer<typeof insertFormTemplateSchema>;
export type FormTemplate = typeof formTemplates.$inferSelect;

// Types for form responses
export const insertFormResponseSchema = createInsertSchema(formResponses).omit({
  id: true,
  submittedAt: true,
});
export type InsertFormResponse = z.infer<typeof insertFormResponseSchema>;
export type FormResponse = typeof formResponses.$inferSelect;

// Report Builder Schema
export const reportTemplates = pgTable("report_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  dataSource: varchar("data_source", { length: 50 }).notNull(), // e.g., "players", "events", "registrations"
  fields: json("fields").notNull(), // selected fields for the report
  layout: json("layout").notNull(), // field positioning and formatting
  filters: json("filters").notNull().default([]), // report filters
  outputFormats: json("output_formats").notNull().default(["pdf"]), // pdf, csv, excel
  scheduleConfig: json("schedule_config"), // cron schedule if automated
  sharing: json("sharing").notNull().default([]), // user IDs with access
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const reportGenerations = pgTable("report_generations", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => reportTemplates.id).notNull(),
  generatedBy: integer("generated_by").references(() => users.id),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, completed, failed
  parameters: json("parameters").notNull().default({}), // generation parameters
  outputUrls: json("output_urls").notNull().default({}), // { pdf: "url", csv: "url" }
  errorMessage: text("error_message"),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at"), // when generated files expire
});

// Types for report builder
export const insertReportTemplateSchema = createInsertSchema(reportTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertReportTemplate = z.infer<typeof insertReportTemplateSchema>;
export type ReportTemplate = typeof reportTemplates.$inferSelect;

export const insertReportGenerationSchema = createInsertSchema(reportGenerations).omit({
  id: true,
  generatedAt: true,
});
export type InsertReportGeneration = z.infer<typeof insertReportGenerationSchema>;
export type ReportGeneration = typeof reportGenerations.$inferSelect;

// Events & Budgeting Schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  eventType: text("event_type", { enum: ["Practice", "School Activity", "Tournament", "Camp", "Team Camp", "Social"] }).notNull().default("Practice"),
  startDate: text("start_date").notNull(), // YYYY-MM-DD format
  endDate: text("end_date"), // YYYY-MM-DD format - optional for single day events
  startTime: text("start_time"), // HH:MM format - optional
  endTime: text("end_time"), // HH:MM format - optional
  location: text("location").notNull(),
  players: integer("players").notNull().default(0),
  courts: integer("courts").notNull().default(0),
  coaches: integer("coaches").notNull().default(0),
  assignedCourts: text("assigned_courts").array().notNull().default([]), // specific court assignments
  feePerPlayer: decimal("fee_per_player", { precision: 10, scale: 2 }).notNull().default("0.00"),
  coachRates: json("coach_rates").notNull().default([]), // array of {profile: string, rate: number}
  miscExpenses: json("misc_expenses").notNull().default([]), // array of {item: string, cost: number}
  projectedRevenue: decimal("projected_revenue", { precision: 10, scale: 2 }).notNull().default("0.00"),
  actualRevenue: decimal("actual_revenue", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status", { enum: ["planning", "active", "completed", "cancelled"] }).notNull().default("planning"),
  // Payment and subscription settings
  registrationFee: decimal("registration_fee", { precision: 10, scale: 2 }).notNull().default("0.00"),
  freeForSubscribers: boolean("free_for_subscribers").notNull().default(true),
  requiredSubscriptionPlan: text("required_subscription_plan"), // null means any active subscription
  maxRegistrations: integer("max_registrations"), // null means unlimited
  // Role-based visibility control for personal calendar usage
  visibleToRoles: text("visible_to_roles").array().notNull().default(['admin', 'manager', 'coach', 'staff', 'player', 'parent']),
  // Communication method override for automated notifications
  commMethodOverride: text("comm_method_override", { 
    enum: ["none", "respect_user_pref", "email_only", "sms_only", "groupme_only", "all"] 
  }).default("none"),
  // Reminder scheduling - array of hours before event to send reminders
  reminderSchedule: json("reminder_schedule").notNull().default([]),
  // Require acknowledgement from users
  acknowledgementsRequired: boolean("acknowledgements_required").notNull().default(false),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Types for events
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Fundraising & Sponsorship Schema
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  goal: decimal("goal", { precision: 10, scale: 2 }).notNull(),
  raised: decimal("raised", { precision: 10, scale: 2 }).notNull().default("0.00"),
  startDate: text("start_date"), // YYYY-MM-DD format
  endDate: text("end_date"), // YYYY-MM-DD format
  status: text("status", { enum: ["active", "completed", "cancelled"] }).notNull().default("active"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sponsors = pgTable("sponsors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"), // URL or base64 image data
  tier: text("tier", { enum: ["Bronze", "Silver", "Gold", "Platinum", "Diamond"] }).notNull(),
  contact: text("contact"), // email
  phone: text("phone"),
  website: text("website"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types for Fundraising
export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

export const insertSponsorSchema = createInsertSchema(sponsors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSponsor = z.infer<typeof insertSponsorSchema>;
export type Sponsor = typeof sponsors.$inferSelect;

// Performance Tracking Schema
export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id),
  playerName: text("player_name").notNull(),
  evaluatorId: integer("evaluator_id").references(() => users.id).notNull(),
  position: text("position").notNull(),
  serving: integer("serving").notNull(),
  serveReceive: integer("serve_receive").notNull(),
  setting: integer("setting").notNull(),
  blocking: integer("blocking").notNull(),
  attacking: integer("attacking").notNull(),
  leadership: integer("leadership").notNull(),
  communication: integer("communication").notNull(),
  coachability: integer("coachability").notNull(),
  weights: json("weights").notNull(),
  compositeScore: decimal("composite_score", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamAssignments = pgTable("team_assignments", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id),
  playerName: text("player_name").notNull(),
  teamName: text("team_name").notNull(),
  position: text("position"),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

// Types for Performance Tracking
export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
  compositeScore: true,
}).extend({
  position: z.string().min(1, "Position is required"),
  serving: z.number().min(1).max(5),
  serveReceive: z.number().min(1).max(5),
  setting: z.number().min(1).max(5),
  blocking: z.number().min(1).max(5),
  attacking: z.number().min(1).max(5),
  leadership: z.number().min(1).max(5),
  communication: z.number().min(1).max(5),
  coachability: z.number().min(1).max(5),
});

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;
export type TeamAssignment = typeof teamAssignments.$inferSelect;

// Google Calendar Integration Schema
export const googleCalendarTokens = pgTable("google_calendar_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  expiresAt: timestamp("expires_at").notNull(),
  scope: text("scope"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarSyncLogs = pgTable("calendar_sync_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventId: integer("event_id").references(() => events.id),
  googleEventId: text("google_event_id"),
  status: text("status", { enum: ["synced", "failed", "updated"] }).notNull(),
  errorMessage: text("error_message"),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
});

// Types for Google Calendar Integration
export const insertGoogleCalendarTokenSchema = createInsertSchema(googleCalendarTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGoogleCalendarToken = z.infer<typeof insertGoogleCalendarTokenSchema>;
export type GoogleCalendarToken = typeof googleCalendarTokens.$inferSelect;
export type CalendarSyncLog = typeof calendarSyncLogs.$inferSelect;

// Podcast Schema
export const podcastEpisodes = pgTable("podcast_episodes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  audioUrl: text("audio_url"),
  duration: text("duration"), // e.g., "45:30"
  status: text("status", { enum: ["draft", "published", "archived"] }).notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const podcastComments = pgTable("podcast_comments", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id").references(() => podcastEpisodes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const podcastPollVotes = pgTable("podcast_poll_votes", {
  id: serial("id").primaryKey(),
  episodeId: integer("episode_id").references(() => podcastEpisodes.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  vote: text("vote", { enum: ["like", "dislike"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Podcast Relations
export const podcastEpisodesRelations = relations(podcastEpisodes, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [podcastEpisodes.createdBy],
    references: [users.id],
  }),
  comments: many(podcastComments),
  pollVotes: many(podcastPollVotes),
}));

export const podcastCommentsRelations = relations(podcastComments, ({ one }) => ({
  episode: one(podcastEpisodes, {
    fields: [podcastComments.episodeId],
    references: [podcastEpisodes.id],
  }),
  user: one(users, {
    fields: [podcastComments.userId],
    references: [users.id],
  }),
}));

export const podcastPollVotesRelations = relations(podcastPollVotes, ({ one }) => ({
  episode: one(podcastEpisodes, {
    fields: [podcastPollVotes.episodeId],
    references: [podcastEpisodes.id],
  }),
  user: one(users, {
    fields: [podcastPollVotes.userId],
    references: [users.id],
  }),
}));

// Types for Podcast
export const insertPodcastEpisodeSchema = createInsertSchema(podcastEpisodes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPodcastCommentSchema = createInsertSchema(podcastComments).omit({
  id: true,
  createdAt: true,
});

export const insertPodcastPollVoteSchema = createInsertSchema(podcastPollVotes).omit({
  id: true,
  createdAt: true,
});

export type InsertPodcastEpisode = z.infer<typeof insertPodcastEpisodeSchema>;
export type PodcastEpisode = typeof podcastEpisodes.$inferSelect;
export type InsertPodcastComment = z.infer<typeof insertPodcastCommentSchema>;
export type PodcastComment = typeof podcastComments.$inferSelect;
export type InsertPodcastPollVote = z.infer<typeof insertPodcastPollVoteSchema>;
export type PodcastPollVote = typeof podcastPollVotes.$inferSelect;

// Coach Resources Schema
export const timeClockEntries = pgTable('time_clock_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  action: varchar('action', { length: 20 }).notNull(), // 'clock-in' or 'clock-out'
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  isManual: boolean('is_manual').notNull().default(false), // true for manual entries
  status: varchar('status', { length: 20 }).notNull().default('approved'), // 'pending', 'approved', 'rejected'
  reason: text('reason'), // reason for manual entry
  approvedBy: integer('approved_by').references(() => users.id), // admin who approved/rejected
  approvedAt: timestamp('approved_at'), // when approved/rejected
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const practicePlans = pgTable('practice_plans', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  drills: text('drills').array().notNull().default([]),
  pdfFileName: text('pdf_file_name'),
  pdfFileSize: integer('pdf_file_size'),
  pdfUploadedAt: timestamp('pdf_uploaded_at'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const gameLineups = pgTable('game_lineups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  players: text('players').array().notNull().default([]),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const gameStats = pgTable('game_stats', {
  id: serial('id').primaryKey(),
  gameId: varchar('game_id', { length: 100 }).notNull(),
  playerName: varchar('player_name', { length: 100 }).notNull(),
  points: integer('points').default(0),
  assists: integer('assists').default(0),
  rebounds: integer('rebounds').default(0),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Coach Matching & Outreach Tables
export const coaches = pgTable('coaches', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  specialties: text('specialties').array().notNull().default([]), // volleyball specialties
  availabilityWindows: json('availability_windows').notNull().default([]), // time windows available
  pastEventRatings: integer('past_event_ratings').array().notNull().default([]), // array of 1-5 ratings
  preferredChannel: text('preferred_channel', { enum: ['email', 'sms'] }).notNull().default('email'),
  location: text('location'),
  hourlyRate: decimal('hourly_rate', { precision: 8, scale: 2 }),
  status: text('status', { enum: ['active', 'inactive', 'unavailable'] }).notNull().default('active'),
  // Enhanced coaching profile fields
  experienceYears: integer('experience_years').notNull().default(0),
  ageGroups: text('age_groups').array().notNull().default([]), // e.g. ['U8','U10','U12','U14','U16','U18']
  skillLevels: text('skill_levels').array().notNull().default([]), // ['beginner','intermediate','advanced']
  weeklyAvailability: json('weekly_availability').notNull().default({}), // e.g. { Mon: ['08:00-12:00'], Tue: [] }
  certifications: text('certifications').array().notNull().default([]), // coaching certifications
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const coachOutreachLogs = pgTable('coach_outreach_logs', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => scheduleEvents.id),
  coachId: integer('coach_id').notNull().references(() => coaches.id),
  attemptNumber: integer('attempt_number').notNull().default(1),
  channel: text('channel', { enum: ['email', 'sms'] }).notNull(),
  messageId: text('message_id'),
  response: text('response', { enum: ['accept', 'decline', 'escalated'] }),
  responseDetails: text('response_details'), // any additional notes
  timestamp: timestamp('timestamp').defaultNow(),
  remindersSent: integer('reminders_sent').notNull().default(0),
});

// Event registrations for training sessions
export const eventRegistrations = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => scheduleEvents.id).notNull(),
  playerName: text("player_name").notNull(),
  playerEmail: text("player_email").notNull(),
  playerPhone: text("player_phone").notNull(),
  playerDateOfBirth: text("player_date_of_birth").notNull(),
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  medicalInfo: text("medical_info"),
  parentName: text("parent_name"), // If registered by parent
  parentEmail: text("parent_email"), // If registered by parent
  parentPhone: text("parent_phone"), // If registered by parent
  registrationType: text("registration_type", { enum: ["player", "parent"] }).notNull(),
  status: text("status", { enum: ["registered", "waitlisted", "cancelled"] }).notNull().default("registered"),
  registrationFee: decimal("registration_fee", { precision: 10, scale: 2 }).notNull().default("25.00"),
  paymentStatus: text("payment_status", { enum: ["pending", "completed", "failed"] }).notNull().default("pending"),
  registeredBy: integer("registered_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Coach Resources Relations
export const timeClockEntriesRelations = relations(timeClockEntries, ({ one }) => ({
  user: one(users, {
    fields: [timeClockEntries.userId],
    references: [users.id]
  })
}));

export const practicePlansRelations = relations(practicePlans, ({ one }) => ({
  createdBy: one(users, {
    fields: [practicePlans.createdBy],
    references: [users.id]
  })
}));

export const gameLineupsRelations = relations(gameLineups, ({ one }) => ({
  createdBy: one(users, {
    fields: [gameLineups.createdBy],
    references: [users.id]
  })
}));

export const gameStatsRelations = relations(gameStats, ({ one }) => ({
  createdBy: one(users, {
    fields: [gameStats.createdBy],
    references: [users.id]
  })
}));

// Coach Matching Relations
export const coachOutreachLogsRelations = relations(coachOutreachLogs, ({ one }) => ({
  event: one(scheduleEvents, {
    fields: [coachOutreachLogs.eventId],
    references: [scheduleEvents.id]
  }),
  coach: one(coaches, {
    fields: [coachOutreachLogs.coachId],
    references: [coaches.id]
  })
}));

// Coach Resources Types
export const insertTimeClockEntrySchema = createInsertSchema(timeClockEntries).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
});

export const insertPracticePlanSchema = createInsertSchema(practicePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameLineupSchema = createInsertSchema(gameLineups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGameStatSchema = createInsertSchema(gameStats).omit({
  id: true,
  createdAt: true,
});

export type InsertTimeClockEntry = z.infer<typeof insertTimeClockEntrySchema>;
export type TimeClockEntry = typeof timeClockEntries.$inferSelect;
export type InsertPracticePlan = z.infer<typeof insertPracticePlanSchema>;
export type PracticePlan = typeof practicePlans.$inferSelect;
export type InsertGameLineup = z.infer<typeof insertGameLineupSchema>;
export type GameLineup = typeof gameLineups.$inferSelect;
export type InsertGameStat = z.infer<typeof insertGameStatSchema>;
export type GameStat = typeof gameStats.$inferSelect;

// Coach Matching Schemas
export const insertCoachSchema = createInsertSchema(coaches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCoachOutreachLogSchema = createInsertSchema(coachOutreachLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type Coach = typeof coaches.$inferSelect;
export type InsertCoachOutreachLog = z.infer<typeof insertCoachOutreachLogSchema>;
export type CoachOutreachLog = typeof coachOutreachLogs.$inferSelect;

// Event Registration Schemas
export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  playerName: z.string().min(1, "Player name is required"),
  playerEmail: z.string().email("Valid email is required"),
  playerPhone: z.string().min(1, "Phone number is required"),
  playerDateOfBirth: z.string().min(1, "Date of birth is required"),
});

export type InsertEventRegistration = z.infer<typeof insertEventRegistrationSchema>;
export type EventRegistration = typeof eventRegistrations.$inferSelect;

// Documents & e-Signatures Tables
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  version: varchar("version", { length: 50 }).default("1.0"),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  expirationType: varchar("expiration_type", { length: 50 }).default("never"), // never, date, renewal
  expirationDate: timestamp("expiration_date"),
  renewalRule: jsonb("renewal_rule"), // JSON for renewal configuration
  reminderSchedule: jsonb("reminder_schedule"), // JSON for reminder settings
  allowedRoles: text("allowed_roles").array().default(["admin", "manager"]),
  requiresSignature: boolean("requires_signature").default(false),
  status: varchar("status", { length: 50 }).default("active"), // active, archived, expired
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const documentSignatures = pgTable("document_signatures", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  signatureData: text("signature_data").notNull(), // Base64 encoded signature image
  signatureType: varchar("signature_type", { length: 50 }).default("canvas"), // canvas, typed, uploaded
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  signedAt: timestamp("signed_at").defaultNow().notNull(),
});

export const documentAuditLogs = pgTable("document_audit_logs", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // view, download, sign, edit, delete, upload
  details: jsonb("details"), // Additional action-specific data
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Document Relations
export const documentRelations = relations(documents, ({ many }) => ({
  signatures: many(documentSignatures),
  auditLogs: many(documentAuditLogs),
}));

export const documentSignatureRelations = relations(documentSignatures, ({ one }) => ({
  document: one(documents, {
    fields: [documentSignatures.documentId],
    references: [documents.id]
  }),
  user: one(users, {
    fields: [documentSignatures.userId],
    references: [users.id]
  })
}));

export const documentAuditLogRelations = relations(documentAuditLogs, ({ one }) => ({
  document: one(documents, {
    fields: [documentAuditLogs.documentId],
    references: [documents.id]
  }),
  user: one(users, {
    fields: [documentAuditLogs.userId],
    references: [users.id]
  })
}));

// Document Schemas
export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDocumentSignatureSchema = createInsertSchema(documentSignatures).omit({
  id: true,
  signedAt: true,
});

export const insertDocumentAuditLogSchema = createInsertSchema(documentAuditLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocumentSignature = z.infer<typeof insertDocumentSignatureSchema>;
export type DocumentSignature = typeof documentSignatures.$inferSelect;
export type InsertDocumentAuditLog = z.infer<typeof insertDocumentAuditLogSchema>;
export type DocumentAuditLog = typeof documentAuditLogs.$inferSelect;

// Dashboard Configuration Schema
export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  component: text("component").notNull(), // component identifier
  description: text("description"),
  defaultRoles: text("default_roles").array().notNull().default([]), // roles that have this widget by default
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  role: text("role", { enum: ["admin", "manager", "coach", "player", "parent", "staff"] }).notNull(),
  widgetId: integer("widget_id"), // Remove foreign key constraint for now
  canView: boolean("can_view").notNull().default(false),
  canManage: boolean("can_manage").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userDashboardConfig = pgTable("user_dashboard_config", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  widgetId: integer("widget_id").references(() => dashboardWidgets.id).notNull(),
  position: integer("position").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Coach Resource Folders Table  
export const coachResourceFolders = pgTable("coach_resource_folders", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: integer("parent_id"),
  category: varchar("category", { length: 100 }).notNull().default("General"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Coach Resources Table (Enhanced with folder support)
export const coachResources = pgTable("coach_resources", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull().default("General"),
  folderId: integer("folder_id").references(() => coachResourceFolders.id),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: integer("file_size"),
  originalFileName: text("original_file_name"),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations for Dashboard Configuration
export const dashboardWidgetsRelations = relations(dashboardWidgets, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userConfigs: many(userDashboardConfig),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  widget: one(dashboardWidgets, {
    fields: [rolePermissions.widgetId],
    references: [dashboardWidgets.id],
  }),
}));

export const userDashboardConfigRelations = relations(userDashboardConfig, ({ one }) => ({
  user: one(users, {
    fields: [userDashboardConfig.userId],
    references: [users.id],
  }),
  widget: one(dashboardWidgets, {
    fields: [userDashboardConfig.widgetId],
    references: [dashboardWidgets.id],
  }),
}));

// Coach Resource Folders Relations
export const coachResourceFoldersRelations = relations(coachResourceFolders, ({ one, many }) => ({
  parent: one(coachResourceFolders, {
    fields: [coachResourceFolders.parentId],
    references: [coachResourceFolders.id],
  }),
  children: many(coachResourceFolders),
  resources: many(coachResources),
  createdByUser: one(users, {
    fields: [coachResourceFolders.createdBy],
    references: [users.id],
  }),
}));

// Coach Resources Relations
export const coachResourcesRelations = relations(coachResources, ({ one }) => ({
  uploadedByUser: one(users, {
    fields: [coachResources.uploadedBy],
    references: [users.id],
  }),
  folder: one(coachResourceFolders, {
    fields: [coachResources.folderId],
    references: [coachResourceFolders.id],
  }),
}));

// Types for Dashboard Configuration
export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertUserDashboardConfigSchema = createInsertSchema(userDashboardConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Coach Resource Folders Schema Types
export const insertCoachResourceFolderSchema = createInsertSchema(coachResourceFolders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Coach Resources Schema Types
export const insertCoachResourceSchema = createInsertSchema(coachResources).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
});

export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertUserDashboardConfig = z.infer<typeof insertUserDashboardConfigSchema>;
export type UserDashboardConfig = typeof userDashboardConfig.$inferSelect;
export type InsertCoachResource = z.infer<typeof insertCoachResourceSchema>;
export type CoachResource = typeof coachResources.$inferSelect;

// Message Logs Schema - for tracking communication delivery status
export const messageLogs = pgTable("message_logs", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  channel: text("channel", { enum: ["email", "sms", "groupme"] }).notNull(),
  status: text("status", { enum: ["queued", "sent", "delivered", "failed"] }).notNull().default("queued"),
  messageId: text("message_id"), // provider message ID for tracking
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  errorMessage: text("error_message"), // store error details if failed
});

export const insertMessageLogSchema = createInsertSchema(messageLogs).omit({
  id: true,
  timestamp: true,
});
export type InsertMessageLog = z.infer<typeof insertMessageLogSchema>;
export type MessageLog = typeof messageLogs.$inferSelect;

// Acknowledgements Schema - for tracking user acknowledgements via magic links
export const acknowledgements = pgTable("acknowledgements", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id),
  userId: integer("user_id").notNull().references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at").defaultNow().notNull(),
  token: text("token").notNull(), // JWT token used for magic link
  ipAddress: text("ip_address"), // track IP for security
});

export const insertAcknowledgementSchema = createInsertSchema(acknowledgements).omit({
  id: true,
  acknowledgedAt: true,
});
export type InsertAcknowledgement = z.infer<typeof insertAcknowledgementSchema>;
export type Acknowledgement = typeof acknowledgements.$inferSelect;
export type InsertCoachResourceFolder = z.infer<typeof insertCoachResourceFolderSchema>;
export type CoachResourceFolder = typeof coachResourceFolders.$inferSelect;
