import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "manager", "coach"] }).notNull(),
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
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Payment = typeof payments.$inferSelect;
export type ScheduleEvent = typeof scheduleEvents.$inferSelect;
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

// Events & Budgeting Schema
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(), // YYYY-MM-DD format
  endDate: text("end_date").notNull(), // YYYY-MM-DD format
  location: text("location").notNull(),
  players: integer("players").notNull().default(0),
  courts: integer("courts").notNull().default(0),
  coaches: integer("coaches").notNull().default(0),
  feePerPlayer: decimal("fee_per_player", { precision: 10, scale: 2 }).notNull().default("0.00"),
  coachRates: json("coach_rates").notNull().default([]), // array of {profile: string, rate: number}
  miscExpenses: json("misc_expenses").notNull().default([]), // array of {item: string, cost: number}
  projectedRevenue: decimal("projected_revenue", { precision: 10, scale: 2 }).notNull().default("0.00"),
  actualRevenue: decimal("actual_revenue", { precision: 10, scale: 2 }).default("0.00"),
  status: text("status", { enum: ["planning", "active", "completed", "cancelled"] }).notNull().default("planning"),
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
