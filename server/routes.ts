import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pusher } from "./pusher";
import { loginSchema, insertRegistrationSchema, insertPaymentSchema, insertScheduleEventSchema, insertPlayerSchema, insertParentSchema, insertEventSchema, insertEvaluationSchema, insertGoogleCalendarTokenSchema, insertPodcastEpisodeSchema, insertPodcastCommentSchema, insertPodcastPollVoteSchema, insertCoachSchema, insertCoachOutreachLogSchema, insertReportTemplateSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "volleyball-club-secret-key";

// Configure multer for PDF uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'pdfs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.validateUserCredentials(username, password);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  // Protected route middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
      if (err) {
        console.error("JWT verification error:", err);
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      
      // JWT should contain userId, username, role
      if (!decoded.userId || !decoded.username || !decoded.role) {
        console.error("Invalid JWT payload:", decoded);
        return res.status(403).json({ message: "Invalid token payload" });
      }
      
      req.user = decoded;
      next();
    });
  };

  // Get current user profile
  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Registration routes
  app.get("/api/registrations", authenticateToken, async (req: any, res) => {
    try {
      // Only admin and manager can view all registrations
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const registrations = await storage.getRegistrations();
      res.json(registrations);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/registrations", async (req, res) => {
    try {
      const validatedData = insertRegistrationSchema.parse(req.body);
      
      const registration = await storage.createRegistration(validatedData);
      
      // Create initial payment record if registration fee > 0
      if (parseFloat(registration.registrationFee) > 0) {
        await storage.createPayment({
          registrationId: registration.id,
          amount: registration.registrationFee,
          paymentMethod: "card", // Default for online registrations
          status: "pending",
        });
      }

      res.status(201).json({
        registration,
        message: "Registration submitted successfully",
      });
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/registrations/:id/status", authenticateToken, async (req: any, res) => {
    try {
      // Only admin and manager can update registration status
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const registration = await storage.updateRegistrationStatus(parseInt(id), status);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      res.json(registration);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Payment routes
  app.get("/api/payments", authenticateToken, async (req: any, res) => {
    try {
      const { registrationId } = req.query;
      
      let payments;
      if (registrationId) {
        payments = await storage.getPaymentsByRegistration(parseInt(registrationId));
      } else {
        // For now, just return empty array for global payments
        // In real implementation, you'd have getAllPayments method
        payments = [];
      }

      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/payments", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mock payment processing endpoint (for demo purposes)
  app.post("/api/payments/:id/process", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const payment = await storage.getPayment(parseInt(id));
      
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      // Simulate payment processing
      const success = Math.random() > 0.1; // 90% success rate for demo
      const status = success ? "completed" : "failed";
      
      const updatedPayment = await storage.updatePaymentStatus(
        parseInt(id), 
        status,
        success ? `mock_intent_${Date.now()}` : undefined
      );

      res.json({ 
        payment: updatedPayment, 
        message: success ? "Payment processed successfully" : "Payment failed" 
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Schedule/Calendar routes
  app.get("/api/schedule", authenticateToken, async (req: any, res) => {
    try {
      // Allow all authenticated users to view schedules
      console.log("Schedule access - User role:", req.user.role);
      if (!["admin", "manager", "coach", "player", "parent"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { from, to, includeEvents } = req.query;
      let events = await storage.getScheduleEvents(from as string, to as string);
      
      // Optionally include budget events that have court assignments and times
      if (includeEvents === "true") {
        try {
          const budgetEvents = await storage.getEvents();
          const scheduleCompatibleEvents = budgetEvents
            .filter(event => 
              event.assignedCourts && 
              Array.isArray(event.assignedCourts) && 
              event.assignedCourts.length > 0 && 
              event.startTime && 
              event.endTime &&
              (!from || event.startDate >= from) &&
              (!to || event.startDate <= to)
            )
            .flatMap(budgetEvent => {
              // For day view, create separate entries for each court
              // For week/month view, we need to show the event with all courts
              if (req.query.viewType === 'day') {
                return (budgetEvent.assignedCourts as string[]).map(court => ({
                  id: `budget-${budgetEvent.id}-${court}`,
                  title: budgetEvent.name,
                  court,
                  date: budgetEvent.startDate,
                  time: budgetEvent.startTime!,
                  duration: budgetEvent.startTime && budgetEvent.endTime ? 
                    Math.max(
                      Math.round(
                        (new Date(`2000-01-01T${budgetEvent.endTime}${budgetEvent.endTime <= budgetEvent.startTime ? 'T+1' : ''}`).getTime() - 
                         new Date(`2000-01-01T${budgetEvent.startTime}`).getTime()) / (1000 * 60)
                      ), 30
                    ) : 120,
                  eventType: budgetEvent.eventType || "Practice", // Use the actual event type from budget events
                  participants: [],
                  coach: "",
                  description: budgetEvent.assignedCourts?.join(', ') || 'Multiple Courts',
                  status: "scheduled" as const,
                  createdBy: budgetEvent.createdBy,
                  createdAt: budgetEvent.createdAt,
                  updatedAt: budgetEvent.updatedAt,
                  budgetEventId: budgetEvent.id
                }));
              } else {
                // For week/month view, create single event with all courts
                return [{
                  id: `budget-${budgetEvent.id}`,
                  title: budgetEvent.name,
                  court: (budgetEvent.assignedCourts as string[]).join(', '),
                  date: budgetEvent.startDate,
                  time: budgetEvent.startTime!,
                  duration: budgetEvent.startTime && budgetEvent.endTime ? 
                    Math.max(
                      Math.round(
                        (new Date(`2000-01-01T${budgetEvent.endTime}${budgetEvent.endTime <= budgetEvent.startTime ? 'T+1' : ''}`).getTime() - 
                         new Date(`2000-01-01T${budgetEvent.startTime}`).getTime()) / (1000 * 60)
                      ), 30
                    ) : 120,
                  eventType: budgetEvent.eventType || "Practice", // Use the actual event type from budget events
                  participants: [],
                  coach: "",
                  description: budgetEvent.assignedCourts?.join(', ') || 'Multiple Courts',
                  status: "scheduled" as const,
                  createdBy: budgetEvent.createdBy,
                  createdAt: budgetEvent.createdAt,
                  updatedAt: budgetEvent.updatedAt,
                  budgetEventId: budgetEvent.id
                }];
              }
            });
          
          events = [...events, ...scheduleCompatibleEvents];
        } catch (budgetEventsError) {
          console.warn("Failed to include budget events in schedule:", budgetEventsError);
        }
      }
      
      res.json({ events });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/schedule", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can create schedule events
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertScheduleEventSchema.parse(req.body);
      
      // Check for schedule conflicts
      const hasConflict = await storage.checkScheduleConflict(
        validatedData.court,
        validatedData.date,
        validatedData.time,
        validatedData.duration || 120
      );

      if (hasConflict) {
        return res.status(409).json({ 
          error: "conflict",
          message: "A scheduling conflict was detected for this court and time slot" 
        });
      }

      const event = await storage.createScheduleEvent({
        ...validatedData,
        createdBy: req.user.userId
      });

      res.status(201).json(event);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/schedule/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update schedule events
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const updateData = req.body;

      // If updating time/date/court, check for conflicts
      if (updateData.court || updateData.date || updateData.time) {
        const existingEvent = await storage.getScheduleEvent(parseInt(id));
        if (!existingEvent) {
          return res.status(404).json({ message: "Event not found" });
        }

        const court = updateData.court || existingEvent.court;
        const date = updateData.date || existingEvent.date;
        const time = updateData.time || existingEvent.time;
        const duration = updateData.duration || existingEvent.duration;

        const hasConflict = await storage.checkScheduleConflict(
          court, date, time, duration, parseInt(id)
        );

        if (hasConflict) {
          return res.status(409).json({ 
            error: "conflict",
            message: "A scheduling conflict was detected for this court and time slot" 
          });
        }
      }

      const event = await storage.updateScheduleEvent(parseInt(id), updateData);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/schedule/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can delete schedule events
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const success = await storage.deleteScheduleEvent(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Player routes
  app.get("/api/players", authenticateToken, async (req: any, res) => {
    try {
      const players = await storage.getPlayers();
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/players", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can create players
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(validatedData);
      res.status(201).json(player);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/players/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update players
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const updateData = req.body;
      
      const player = await storage.updatePlayer(parseInt(id), updateData);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/players/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can delete players
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const success = await storage.deletePlayer(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json({ message: "Player deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Parent routes
  app.get("/api/parents", authenticateToken, async (req: any, res) => {
    try {
      const parents = await storage.getParents();
      res.json(parents);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/parents", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can create parents
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const validatedData = insertParentSchema.parse(req.body);
      const parent = await storage.createParent(validatedData);
      res.status(201).json(parent);
    } catch (error: any) {
      if (error.errors) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/parents/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update parents
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const updateData = req.body;
      
      const parent = await storage.updateParent(parseInt(id), updateData);
      if (!parent) {
        return res.status(404).json({ message: "Parent not found" });
      }

      res.json(parent);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/parents/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can delete parents
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const success = await storage.deleteParent(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Parent not found" });
      }

      res.json({ message: "Parent deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Communication routes
  app.post("/api/chat/send", authenticateToken, async (req: any, res) => {
    try {
      const { text, senderId } = req.body;

      if (!text || !text.trim()) {
        return res.status(400).json({ message: "Message text is required" });
      }

      const players = await storage.getPlayers();
      const message = {
        id: Date.now().toString(),
        from: senderId || req.user.username,
        text: text.trim(),
        date: new Date().toISOString(),
      };

      // Mock send to each player via their communication preference
      const deliveryResults: any[] = [];
      for (const player of players) {
        const channel = player.communicationPreference || "Email";
        console.log(`[MOCK SEND] to ${player.name} via ${channel}: ${text}`);
        deliveryResults.push({ 
          playerId: player.id, 
          playerName: player.name,
          channel, 
          status: "delivered" 
        });
      }

      // Try to broadcast message event, but don't fail if Pusher has issues
      try {
        console.log("Attempting to broadcast message:", message.id);
        await pusher.trigger("global-chat", "message", message);
        console.log("Message broadcast successful");

        // Send delivery status updates
        for (const result of deliveryResults) {
          await pusher.trigger("global-chat", "delivery_status", {
            playerId: result.playerId,
            playerName: result.playerName,
            channel: result.channel,
            status: result.status,
            messageId: message.id,
          });
        }
      } catch (pusherError) {
        console.error("Pusher error (continuing without real-time updates):", pusherError);
        // Continue without real-time updates - the API call will still succeed
      }

      res.json({ ok: true, message, deliveryResults });
    } catch (error) {
      console.error("Chat send error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Twilio SMS Webhook for incoming replies
  app.post("/api/webhook/sms", async (req, res) => {
    try {
      // Twilio sends data as x-www-form-urlencoded
      const from = req.body.From;
      const body = req.body.Body;
      const messageSid = req.body.MessageSid;

      console.log(`[INBOUND SMS] from ${from}: ${body}`);

      // Build a reply message object
      const replyMessage = {
        id: Date.now().toString(),
        from: `SMS: ${from}`,
        text: body,
        date: new Date().toISOString(),
        source: "sms_reply",
        messageSid,
      };

      // Broadcast to Pusher so frontend updates in real time
      try {
        await pusher.trigger("global-chat", "message", replyMessage);
        await pusher.trigger("notifications", "sms_reply", replyMessage);
        console.log("SMS reply broadcast successful");
      } catch (pusherError) {
        console.error("Pusher error for SMS reply:", pusherError);
      }

      // Twilio expects valid XML response
      res.status(200).send("<Response></Response>");
    } catch (error) {
      console.error("SMS webhook error:", error);
      res.status(200).send("<Response></Response>"); // Still respond to Twilio
    }
  });

  // SendGrid Email Webhook for incoming email replies (optional)
  app.post("/api/webhook/email", async (req, res) => {
    try {
      // SendGrid inbound parse webhook
      const from = req.body.from || req.body.envelope?.from;
      const subject = req.body.subject || "";
      const text = req.body.text || "";

      console.log(`[INBOUND EMAIL] from ${from}: ${subject}`);

      const replyMessage = {
        id: Date.now().toString(),
        from: `Email: ${from}`,
        text: subject ? `Subject: ${subject}\n\n${text}` : text || "(No body)",
        date: new Date().toISOString(),
        source: "email_reply",
      };

      // Broadcast to Pusher
      try {
        await pusher.trigger("global-chat", "message", replyMessage);
        await pusher.trigger("notifications", "email_reply", replyMessage);
        console.log("Email reply broadcast successful");
      } catch (pusherError) {
        console.error("Pusher error for email reply:", pusherError);
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("Email webhook error:", error);
      res.status(200).send("OK");
    }
  });

  // GroupMe Bot Webhook for incoming messages
  app.post("/api/webhook/groupme", async (req, res) => {
    try {
      const { text, name, sender_type, group_id } = req.body;

      // Ignore messages from bots to prevent loops
      if (sender_type === "bot") {
        return res.status(200).send("ignored");
      }

      console.log(`[INBOUND GROUPME] from ${name}: ${text}`);

      const replyMessage = {
        id: Date.now().toString(),
        from: `GroupMe: ${name}`,
        text: text,
        date: new Date().toISOString(),
        source: "groupme_reply",
        group_id,
      };

      // Broadcast to Pusher
      try {
        await pusher.trigger("global-chat", "message", replyMessage);
        await pusher.trigger("notifications", "groupme_reply", replyMessage);
        console.log("GroupMe reply broadcast successful");
      } catch (pusherError) {
        console.error("Pusher error for GroupMe reply:", pusherError);
      }

      res.status(200).send("OK");
    } catch (error) {
      console.error("GroupMe webhook error:", error);
      res.status(200).send("OK");
    }
  });

  // Form Templates Routes
  app.get("/api/forms/templates", authenticateToken, async (req: any, res) => {
    try {
      console.log("GET /api/forms/templates called, user:", req.user);
      const templates = await storage.getFormTemplates();
      console.log("Found templates:", templates.length);
      res.json(templates);
    } catch (error) {
      console.error("Get templates error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/forms/templates", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can create templates
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { name, description, fields } = req.body;

      if (!name || !fields || !Array.isArray(fields)) {
        return res.status(400).json({ message: "Name and fields are required" });
      }

      const template = await storage.createFormTemplate({
        name: name.trim(),
        description: description?.trim() || null,
        fields,
        createdBy: req.user.id,
        isActive: true
      });

      res.status(201).json(template);
    } catch (error) {
      console.error("Create template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/forms/templates/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update templates
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { name, description, fields } = req.body;

      if (!name || !fields || !Array.isArray(fields)) {
        return res.status(400).json({ message: "Name and fields are required" });
      }

      const updatedTemplate = await storage.updateFormTemplate(parseInt(id), {
        name: name.trim(),
        description: description?.trim() || null,
        fields
      });

      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(updatedTemplate);
    } catch (error) {
      console.error("Update template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/forms/templates/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can delete templates
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const success = await storage.deleteFormTemplate(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Delete template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/forms/templates/:id/responses", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const responses = await storage.getFormResponses(parseInt(id));
      res.json(responses);
    } catch (error) {
      console.error("Get responses error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/forms/templates/:id/responses", async (req, res) => {
    try {
      const { id } = req.params;
      const { responderName, responderEmail, answers } = req.body;

      if (!responderName || !answers) {
        return res.status(400).json({ message: "Responder name and answers are required" });
      }

      const response = await storage.createFormResponse({
        templateId: parseInt(id),
        responderName: responderName.trim(),
        responderEmail: responderEmail?.trim() || null,
        answers,
        status: "completed"
      });

      res.status(201).json(response);
    } catch (error) {
      console.error("Submit response error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Report Builder Routes
  app.get("/api/reports/templates", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can access report templates
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const templates = await storage.getReportTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Get report templates error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reports/templates", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can create report templates
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const templateData = insertReportTemplateSchema.parse({
        ...req.body,
        createdBy: req.user.userId
      });

      const template = await storage.createReportTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      console.error("Create report template error:", error);
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  app.get("/api/reports/templates/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can access report templates
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const template = await storage.getReportTemplate(parseInt(id));
      
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(template);
    } catch (error) {
      console.error("Get report template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/reports/templates/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update report templates
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const templateData = req.body;
      
      const updatedTemplate = await storage.updateReportTemplate(parseInt(id), templateData);
      
      if (!updatedTemplate) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Update report template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/reports/templates/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can delete report templates
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const success = await storage.deleteReportTemplate(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Delete report template error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/reports/templates/:id/generate", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can generate reports
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const parameters = req.body;
      
      const generation = await storage.generateReport(parseInt(id), req.user.userId, parameters);
      res.json(generation);
    } catch (error) {
      console.error("Generate report error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/reports/data-sources", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can access data sources
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const dataSources = [
        {
          name: "players",
          label: "Players",
          fields: [
            { name: "id", label: "ID", type: "number" },
            { name: "name", label: "Name", type: "text" },
            { name: "dateOfBirth", label: "Date of Birth", type: "date" },
            { name: "contact", label: "Email", type: "text" },
            { name: "phone", label: "Phone", type: "text" },
            { name: "teams", label: "Teams", type: "array" },
            { name: "status", label: "Status", type: "text" },
            { name: "createdAt", label: "Created Date", type: "date" }
          ]
        },
        {
          name: "events",
          label: "Events", 
          fields: [
            { name: "id", label: "ID", type: "number" },
            { name: "name", label: "Event Name", type: "text" },
            { name: "startDate", label: "Start Date", type: "date" },
            { name: "endDate", label: "End Date", type: "date" },
            { name: "location", label: "Location", type: "text" },
            { name: "players", label: "Player Count", type: "number" },
            { name: "status", label: "Status", type: "text" },
            { name: "projectedRevenue", label: "Projected Revenue", type: "currency" },
            { name: "actualRevenue", label: "Actual Revenue", type: "currency" }
          ]
        },
        {
          name: "registrations",
          label: "Registrations",
          fields: [
            { name: "id", label: "ID", type: "number" },
            { name: "name", label: "Player Name", type: "text" },
            { name: "email", label: "Email", type: "text" },
            { name: "phone", label: "Phone", type: "text" },
            { name: "status", label: "Status", type: "text" },
            { name: "registrationFee", label: "Registration Fee", type: "currency" },
            { name: "createdAt", label: "Registration Date", type: "date" }
          ]
        }
      ];
      
      res.json(dataSources);
    } catch (error) {
      console.error("Get data sources error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Events Routes
  app.get("/api/events", authenticateToken, async (req: any, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/events/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const event = await storage.getEvent(parseInt(id));
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Get event error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/events", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can create events
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const eventData = insertEventSchema.parse({
        ...req.body,
        createdBy: req.user.userId
      });

      const event = await storage.createEvent(eventData);
      
      // Auto-create schedule entries for assigned courts if times are provided
      if (event.assignedCourts && Array.isArray(event.assignedCourts) && 
          event.assignedCourts.length > 0 && event.startTime && event.endTime) {
        
        try {
          // Calculate event duration in minutes
          const startTime = new Date(`2000-01-01T${event.startTime}`);
          const endTime = new Date(`2000-01-01T${event.endTime}`);
          if (endTime <= startTime) {
            endTime.setDate(endTime.getDate() + 1); // Handle overnight events
          }
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationMinutes = Math.max(Math.round(durationMs / (1000 * 60)), 30); // Minimum 30 minutes

          // Create schedule entry for each assigned court
          for (const court of event.assignedCourts) {
            // Check for conflicts before creating
            const hasConflict = await storage.checkScheduleConflict(
              court,
              event.startDate,
              event.startTime,
              durationMinutes
            );

            if (!hasConflict) {
              await storage.createScheduleEvent({
                title: event.name,
                court: court,
                date: event.startDate,
                time: event.startTime,
                duration: durationMinutes,
                eventType: event.eventType || "Practice", // Use actual event type
                participants: [], // Can be populated later
                coach: "", // Can be populated later
                description: event.assignedCourts?.join(', ') || 'Multiple Courts',
                status: "scheduled",
                createdBy: req.user.userId
              });
            }
          }
        } catch (scheduleError) {
          console.warn("Failed to create schedule entries for event:", scheduleError);
          // Don't fail the event creation if schedule creation fails
        }
      }
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Create event error:", error);
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.put("/api/events/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update events
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const eventData = req.body;
      
      const updatedEvent = await storage.updateEvent(parseInt(id), eventData);
      
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Update related schedule events if court assignments or times changed
      if (updatedEvent.assignedCourts && Array.isArray(updatedEvent.assignedCourts) && 
          updatedEvent.assignedCourts.length > 0 && updatedEvent.startTime && updatedEvent.endTime) {
        
        try {
          // First, remove any existing schedule events for this budget event
          const existingScheduleEvents = await storage.getScheduleEventsByEventName(updatedEvent.name);
          for (const scheduleEvent of existingScheduleEvents) {
            if (scheduleEvent.budgetEventId) {
              await storage.deleteScheduleEvent(scheduleEvent.id);
            }
          }
          
          // Calculate event duration in minutes
          const startTime = new Date(`2000-01-01T${updatedEvent.startTime}`);
          const endTime = new Date(`2000-01-01T${updatedEvent.endTime}`);
          if (endTime <= startTime) {
            endTime.setDate(endTime.getDate() + 1);
          }
          const durationMs = endTime.getTime() - startTime.getTime();
          const durationMinutes = Math.max(Math.round(durationMs / (1000 * 60)), 30);

          // Create new schedule entries for updated court assignments
          for (const court of updatedEvent.assignedCourts) {
            const hasConflict = await storage.checkScheduleConflict(
              court,
              updatedEvent.startDate,
              updatedEvent.startTime,
              durationMinutes
            );

            if (!hasConflict) {
              await storage.createScheduleEvent({
                title: updatedEvent.name,
                court: court,
                date: updatedEvent.startDate,
                time: updatedEvent.startTime,
                duration: durationMinutes,
                eventType: updatedEvent.eventType || "Practice", // Use actual event type
                participants: [],
                coach: "",
                description: updatedEvent.assignedCourts?.join(', ') || 'Multiple Courts',
                status: "scheduled",
                createdBy: req.user.userId
              });
            }
          }
        } catch (scheduleError) {
          console.warn("Failed to update schedule entries for event:", scheduleError);
        }
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/events/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can delete events
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const success = await storage.deleteEvent(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Campaign Routes
  app.get("/api/campaigns", authenticateToken, async (req: any, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Get campaigns error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/campaigns", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can create campaigns
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const campaignData = { ...req.body, createdBy: req.user.id };
      const campaign = await storage.createCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Create campaign error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/campaigns/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update campaigns
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const campaignData = req.body;
      
      const updatedCampaign = await storage.updateCampaign(parseInt(id), campaignData);
      
      if (!updatedCampaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json(updatedCampaign);
    } catch (error) {
      console.error("Update campaign error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/campaigns/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can delete campaigns
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const success = await storage.deleteCampaign(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      
      res.json({ message: "Campaign deleted successfully" });
    } catch (error) {
      console.error("Delete campaign error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sponsor Routes
  app.get("/api/sponsors", authenticateToken, async (req: any, res) => {
    try {
      const sponsors = await storage.getSponsors();
      res.json(sponsors);
    } catch (error) {
      console.error("Get sponsors error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/sponsors", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can create sponsors
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const sponsorData = { ...req.body, createdBy: req.user.id };
      const sponsor = await storage.createSponsor(sponsorData);
      res.status(201).json(sponsor);
    } catch (error) {
      console.error("Create sponsor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/sponsors/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update sponsors
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const sponsorData = req.body;
      
      const updatedSponsor = await storage.updateSponsor(parseInt(id), sponsorData);
      
      if (!updatedSponsor) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      
      res.json(updatedSponsor);
    } catch (error) {
      console.error("Update sponsor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/sponsors/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can delete sponsors
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const success = await storage.deleteSponsor(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Sponsor not found" });
      }
      
      res.json({ message: "Sponsor deleted successfully" });
    } catch (error) {
      console.error("Delete sponsor error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Performance Tracking routes
  app.get("/api/evaluations", authenticateToken, async (req: any, res) => {
    try {
      const evaluations = await storage.getEvaluations();
      
      // Format data for the Scoreboard component
      const formatted = evaluations.map(evaluation => ({
        name: evaluation.playerName,
        composite: parseFloat(evaluation.compositeScore),
        scores: {
          "Serving": evaluation.serving,
          "Serve Receive": evaluation.serveReceive,
          "Setting": evaluation.setting,
          "Blocking": evaluation.blocking,
          "Attacking": evaluation.attacking,
          "Leadership": evaluation.leadership,
          "Communication": evaluation.communication,
          "Coachability": evaluation.coachability,
        }
      }));
      
      res.json(formatted);
    } catch (error) {
      console.error("Get evaluations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/evaluations", authenticateToken, async (req: any, res) => {
    try {
      const { position, scores, weights } = req.body;
      
      if (!position || !scores || !weights) {
        return res.status(400).json({ message: "Position, scores, and weights are required" });
      }

      // Create evaluation object matching schema
      const evaluationData = {
        playerName: `Player ${Date.now()}`, // Placeholder since no player selection in form
        evaluatorId: req.user.userId,
        position,
        serving: scores.Serving || 3,
        serveReceive: scores["Serve Receive"] || 3,
        setting: scores.Setting || 3,
        blocking: scores.Blocking || 3,
        attacking: scores.Attacking || 3,
        leadership: scores.Leadership || 3,
        communication: scores.Communication || 3,
        coachability: scores.Coachability || 3,
        weights: weights,
      };
      
      const evaluation = await storage.createEvaluation(evaluationData);
      res.json(evaluation);
    } catch (error) {
      console.error("Create evaluation error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/teams/auto", authenticateToken, async (req: any, res) => {
    try {
      // Get all evaluations to form teams
      const evaluations = await storage.getEvaluations();
      
      if (evaluations.length === 0) {
        return res.json({ message: "No evaluations found", teams: [] });
      }

      // Simple auto-team formation algorithm
      // Sort players by composite score and distribute evenly
      const sortedPlayers = evaluations
        .map(evaluation => ({
          name: evaluation.playerName,
          score: parseFloat(evaluation.compositeScore),
          position: evaluation.position
        }))
        .sort((a, b) => b.score - a.score);

      const numTeams = Math.min(4, Math.ceil(sortedPlayers.length / 6)); // Max 4 teams, ~6 players each
      const teams: any = {};
      
      for (let i = 0; i < numTeams; i++) {
        teams[`Team ${String.fromCharCode(65 + i)}`] = [];
      }
      
      // Distribute players in round-robin fashion
      sortedPlayers.forEach((player, index) => {
        const teamIndex = index % numTeams;
        const teamName = `Team ${String.fromCharCode(65 + teamIndex)}`;
        teams[teamName].push(player);
      });

      // Save team assignments to database
      const assignments = [];
      for (const [teamName, players] of Object.entries(teams)) {
        for (const player of players as any[]) {
          assignments.push({
            playerName: player.name,
            teamName,
            position: player.position
          });
        }
      }
      
      await storage.createTeamAssignments(assignments);
      
      res.json(teams);
    } catch (error) {
      console.error("Auto-form teams error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Google Calendar Integration routes
  app.post("/api/integrations/calendar", authenticateToken, async (req: any, res) => {
    try {
      const { access_token, id_token, expires_at, refresh_token } = req.body;
      
      if (!access_token || !expires_at) {
        return res.status(400).json({ message: "Access token and expires_at are required" });
      }

      const tokenData = {
        userId: req.user.userId,
        accessToken: access_token,
        refreshToken: refresh_token || null,
        idToken: id_token || null,
        expiresAt: new Date(expires_at),
        scope: "https://www.googleapis.com/auth/calendar.events"
      };

      // Check if token already exists for this user
      const existingToken = await storage.getGoogleCalendarToken(req.user.userId);
      let token;
      
      if (existingToken) {
        token = await storage.updateGoogleCalendarToken(req.user.userId, tokenData);
      } else {
        token = await storage.createGoogleCalendarToken(tokenData);
      }

      res.json({ 
        message: "Google Calendar connected successfully",
        token: {
          id: token?.id,
          expiresAt: token?.expiresAt
        }
      });
    } catch (error) {
      console.error("Google Calendar connection error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/integrations/calendar/status", authenticateToken, async (req: any, res) => {
    try {
      const token = await storage.getGoogleCalendarToken(req.user.userId);
      
      if (!token) {
        return res.json({ connected: false });
      }

      const isExpired = new Date() > new Date(token.expiresAt);
      
      res.json({ 
        connected: !isExpired,
        expiresAt: token.expiresAt,
        expired: isExpired
      });
    } catch (error) {
      console.error("Calendar status check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/integrations/calendar", authenticateToken, async (req: any, res) => {
    try {
      const success = await storage.deleteGoogleCalendarToken(req.user.userId);
      
      if (!success) {
        return res.status(404).json({ message: "No Google Calendar connection found" });
      }

      res.json({ message: "Google Calendar disconnected successfully" });
    } catch (error) {
      console.error("Google Calendar disconnect error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // This endpoint is no longer needed since we're importing FROM Google Calendar, not TO it
  // Keeping it for potential future bidirectional sync
  app.get("/api/events/upcoming", authenticateToken, async (req: any, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Get upcoming events error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/integrations/calendar/logs", authenticateToken, async (req: any, res) => {
    try {
      const logs = await storage.getCalendarSyncLogs(req.user.userId);
      res.json(logs);
    } catch (error) {
      console.error("Get calendar sync logs error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Podcast Routes
  app.get("/api/podcast/episodes", async (req, res) => {
    try {
      const episodes = await storage.getPodcastEpisodes();
      res.json(episodes);
    } catch (error) {
      console.error("Get podcast episodes error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/podcast/episodes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const episode = await storage.getPodcastEpisode(parseInt(id));
      
      if (!episode) {
        return res.status(404).json({ message: "Episode not found" });
      }
      
      res.json(episode);
    } catch (error) {
      console.error("Get podcast episode error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/podcast/episodes", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can create episodes
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const episodeData = insertPodcastEpisodeSchema.parse({
        ...req.body,
        createdBy: req.user.userId
      });

      const episode = await storage.createPodcastEpisode(episodeData);
      res.status(201).json(episode);
    } catch (error) {
      console.error("Create podcast episode error:", error);
      res.status(400).json({ message: "Invalid episode data" });
    }
  });

  app.put("/api/podcast/episodes/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update episodes
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const episodeData = req.body;
      
      const updatedEpisode = await storage.updatePodcastEpisode(parseInt(id), episodeData);
      
      if (!updatedEpisode) {
        return res.status(404).json({ message: "Episode not found" });
      }
      
      res.json(updatedEpisode);
    } catch (error) {
      console.error("Update podcast episode error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/podcast/episodes/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins can delete episodes
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const success = await storage.deletePodcastEpisode(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Episode not found" });
      }
      
      res.json({ message: "Episode deleted successfully" });
    } catch (error) {
      console.error("Delete podcast episode error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Podcast Comments
  app.get("/api/podcast/episodes/:id/comments", async (req, res) => {
    try {
      const { id } = req.params;
      const comments = await storage.getPodcastCommentsByEpisode(parseInt(id));
      res.json(comments);
    } catch (error) {
      console.error("Get podcast comments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/podcast/episodes/:id/comments", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { content } = insertPodcastCommentSchema.parse({
        ...req.body,
        episodeId: parseInt(id),
        userId: req.user.userId
      });

      const comment = await storage.createPodcastComment({
        episodeId: parseInt(id),
        userId: req.user.userId,
        content
      });

      // Get the comment with author name
      const commentWithAuthor = await storage.getPodcastComment(comment.id);
      res.status(201).json(commentWithAuthor);
    } catch (error) {
      console.error("Create podcast comment error:", error);
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  app.delete("/api/podcast/comments/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const comment = await storage.getPodcastComment(parseInt(id));
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Users can only delete their own comments, admins can delete any
      if (comment.userId !== req.user.userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deletePodcastComment(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Delete podcast comment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Podcast Poll Votes
  app.get("/api/podcast/episodes/:id/poll-vote", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const vote = await storage.getPodcastPollVote(parseInt(id), req.user.userId);
      
      if (!vote) {
        return res.json({ vote: null });
      }
      
      res.json({ vote: vote.vote });
    } catch (error) {
      console.error("Get podcast poll vote error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/podcast/episodes/:id/poll-vote", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { vote } = insertPodcastPollVoteSchema.parse({
        ...req.body,
        episodeId: parseInt(id),
        userId: req.user.userId
      });

      // Check if user already voted
      const existingVote = await storage.getPodcastPollVote(parseInt(id), req.user.userId);
      
      if (existingVote) {
        // Update existing vote
        const updatedVote = await storage.updatePodcastPollVote(parseInt(id), req.user.userId, vote);
        res.json({ vote: updatedVote?.vote });
      } else {
        // Create new vote
        const newVote = await storage.createPodcastPollVote({
          episodeId: parseInt(id),
          userId: req.user.userId,
          vote
        });
        res.status(201).json({ vote: newVote.vote });
      }
    } catch (error) {
      console.error("Create/update podcast poll vote error:", error);
      res.status(400).json({ message: "Invalid vote data" });
    }
  });

  // Coach Resources Routes
  
  // Time Clock Routes
  app.post('/api/timeclock', authenticateToken, async (req: any, res) => {
    try {
      const { action, timestamp, reason, isManual } = req.body;
      
      if (!action || !["clock-in", "clock-out"].includes(action)) {
        return res.status(400).json({ error: "Invalid action" });
      }

      const entry = await storage.createTimeClockEntry({
        userId: req.user.userId,
        action,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        isManual: isManual || false,
        status: isManual ? 'pending' : 'approved',
        reason: reason || null,
      });

      res.json(entry);
    } catch (error) {
      console.error('Time clock error:', error);
      res.status(500).json({ error: 'Failed to record time' });
    }
  });

  // Get pending manual time entries (admin only)
  app.get('/api/timeclock/pending', authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin only." });
      }

      const pendingEntries = await storage.getPendingTimeClockEntries();
      res.json(pendingEntries);
    } catch (error) {
      console.error('Failed to fetch pending entries:', error);
      res.status(500).json({ error: 'Failed to fetch pending entries' });
    }
  });

  // Approve manual time entry (admin only)
  app.post('/api/timeclock/:entryId/approve', authenticateToken, async (req: any, res) => {
    try {
      const entryId = parseInt(req.params.entryId);
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin only." });
      }

      const approvedEntry = await storage.approveTimeClockEntry(entryId, req.user.userId);
      
      if (!approvedEntry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      res.json(approvedEntry);
    } catch (error) {
      console.error('Failed to approve entry:', error);
      res.status(500).json({ error: 'Failed to approve entry' });
    }
  });

  // Reject manual time entry (admin only)
  app.post('/api/timeclock/:entryId/reject', authenticateToken, async (req: any, res) => {
    try {
      const entryId = parseInt(req.params.entryId);
      
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access denied. Admin only." });
      }

      const rejectedEntry = await storage.rejectTimeClockEntry(entryId, req.user.userId);
      
      if (!rejectedEntry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      res.json(rejectedEntry);
    } catch (error) {
      console.error('Failed to reject entry:', error);
      res.status(500).json({ error: 'Failed to reject entry' });
    }
  });

  app.get('/api/timeclock/today', authenticateToken, async (req: any, res) => {
    try {
      const entries = await storage.getTodayTimeClockEntries(req.user.userId);
      res.json(entries);
    } catch (error) {
      console.error('Get time clock entries error:', error);
      res.status(500).json({ error: 'Failed to get time entries' });
    }
  });

  app.get('/api/timeclock/history', authenticateToken, async (req: any, res) => {
    try {
      const entries = await storage.getAllTimeClockEntries(req.user.userId);
      res.json(entries);
    } catch (error) {
      console.error('Get time clock history error:', error);
      res.status(500).json({ error: 'Failed to get time history' });
    }
  });

  // Practice Plans Routes
  app.get('/api/practice-plans', authenticateToken, async (req: any, res) => {
    try {
      const plans = await storage.getPracticePlans();
      res.json(plans);
    } catch (error) {
      console.error('Get practice plans error:', error);
      res.status(500).json({ error: 'Failed to get practice plans' });
    }
  });

  app.post('/api/practice-plans', authenticateToken, async (req: any, res) => {
    try {
      if (!req.user.role || !['admin', 'manager', 'coach'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { title, description, drills } = req.body;
      
      const plan = await storage.createPracticePlan({
        title,
        description,
        drills,
        createdBy: req.user.userId
      });

      res.json(plan);
    } catch (error) {
      console.error('Create practice plan error:', error);
      res.status(500).json({ error: 'Failed to create practice plan' });
    }
  });

  app.put('/api/practice-plans/:id', authenticateToken, async (req: any, res) => {
    try {
      if (!req.user.role || !['admin', 'manager', 'coach'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { id } = req.params;
      const { title, description, drills } = req.body;
      
      const plan = await storage.updatePracticePlan(parseInt(id), {
        title,
        description,
        drills
      });

      res.json(plan);
    } catch (error) {
      console.error('Update practice plan error:', error);
      res.status(500).json({ error: 'Failed to update practice plan' });
    }
  });

  app.delete('/api/practice-plans/:id', authenticateToken, async (req: any, res) => {
    try {
      if (!req.user.role || !['admin', 'manager', 'coach'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { id } = req.params;
      
      // Get the plan first to check for PDF file
      const plan = await storage.getPracticePlan(parseInt(id));
      if (plan && plan.pdfFileName) {
        // Delete the PDF file from filesystem
        const filePath = path.join(uploadsDir, plan.pdfFileName);
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.warn('Could not delete PDF file:', err);
        }
      }
      
      await storage.deletePracticePlan(parseInt(id));
      
      res.json({ success: true });
    } catch (error) {
      console.error('Delete practice plan error:', error);
      res.status(500).json({ error: 'Failed to delete practice plan' });
    }
  });

  // PDF Upload endpoint
  app.post('/api/practice-plans/upload-pdf', authenticateToken, upload.single('pdf'), async (req: any, res) => {
    try {
      if (!req.user.role || !['admin', 'manager', 'coach'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No PDF file provided' });
      }

      const planId = parseInt(req.body.planId);
      if (!planId) {
        return res.status(400).json({ error: 'Practice plan ID required' });
      }

      // Generate a unique filename
      const fileExtension = path.extname(req.file.originalname);
      const uniqueFilename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExtension}`;
      const finalPath = path.join(uploadsDir, uniqueFilename);

      // Move the uploaded file to the final location
      fs.renameSync(req.file.path, finalPath);

      // Update the practice plan with PDF info
      const updatedPlan = await storage.updatePracticePlan(planId, {
        pdfFileName: uniqueFilename,
        pdfFileSize: req.file.size,
        pdfUploadedAt: new Date()
      });

      if (!updatedPlan) {
        // Clean up the uploaded file if plan update failed
        fs.unlinkSync(finalPath);
        return res.status(404).json({ error: 'Practice plan not found' });
      }

      res.json({ 
        message: 'PDF uploaded successfully',
        plan: updatedPlan
      });
    } catch (error) {
      console.error('PDF upload error:', error);
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: 'Failed to upload PDF' });
    }
  });

  // PDF Download endpoint
  app.get('/api/practice-plans/:id/download-pdf', authenticateToken, async (req: any, res) => {
    try {
      const planId = parseInt(req.params.id);
      const plan = await storage.getPracticePlan(planId);

      if (!plan) {
        return res.status(404).json({ error: 'Practice plan not found' });
      }

      if (!plan.pdfFileName) {
        return res.status(404).json({ error: 'No PDF attached to this practice plan' });
      }

      const filePath = path.join(uploadsDir, plan.pdfFileName);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'PDF file not found on server' });
      }

      // Set appropriate headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${plan.title}.pdf"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('PDF download error:', error);
      res.status(500).json({ error: 'Failed to download PDF' });
    }
  });



  // User Management Routes (Admin only)
  app.get("/api/users", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can access user management
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const users = await storage.getUsers();
      // Remove passwords from response
      const safeUsers = users.map(({ password, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can create users
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { name, username, password, role } = req.body;

      if (!name || !username || !password || !role) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const user = await storage.createUser({
        name: name.trim(),
        username: username.trim(),
        password: password,
        role: role
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can update users
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const { name, username, password, role } = req.body;

      if (!name || !username || !role) {
        return res.status(400).json({ message: "Name, username, and role are required" });
      }

      const updateData: any = {
        name: name.trim(),
        username: username.trim(),
        role: role
      };

      // Only update password if provided
      if (password && password.trim()) {
        updateData.password = password;
      }

      const user = await storage.updateUser(parseInt(id), updateData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can delete users
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const userId = parseInt(id);

      // Prevent admin from deleting themselves
      if (userId === req.user.userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Coach Management Routes
  app.get("/api/coaches", authenticateToken, async (req: any, res) => {
    try {
      const coaches = await storage.getCoaches();
      res.json(coaches);
    } catch (error) {
      console.error("Get coaches error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/coaches/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const coach = await storage.getCoach(parseInt(id));
      
      if (!coach) {
        return res.status(404).json({ message: "Coach not found" });
      }
      
      res.json(coach);
    } catch (error) {
      console.error("Get coach error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/coaches", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can create coaches
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const coachData = insertCoachSchema.parse(req.body);
      const coach = await storage.createCoach(coachData);
      res.status(201).json(coach);
    } catch (error) {
      console.error("Create coach error:", error);
      res.status(400).json({ message: "Invalid coach data" });
    }
  });

  app.put("/api/coaches/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update coaches
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const coachData = req.body;
      
      const updatedCoach = await storage.updateCoach(parseInt(id), coachData);
      
      if (!updatedCoach) {
        return res.status(404).json({ message: "Coach not found" });
      }
      
      res.json(updatedCoach);
    } catch (error) {
      console.error("Update coach error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/coaches/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can delete coaches
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { id } = req.params;
      const success = await storage.deleteCoach(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Coach not found" });
      }
      
      res.json({ message: "Coach deleted successfully" });
    } catch (error) {
      console.error("Delete coach error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Coach Matching Routes
  app.get("/api/coach-match", authenticateToken, async (req: any, res) => {
    try {
      const { eventId, limit = 5 } = req.query;
      
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      // Get event details
      const event = await storage.getScheduleEvent(parseInt(eventId));
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Get all coaches
      const allCoaches = await storage.getCoaches();
      const activeCoaches = allCoaches.filter(coach => coach.status === 'active');

      // Simple scoring algorithm (in a real app, this would be more sophisticated)
      const scoredCoaches = activeCoaches.map(coach => {
        let score = 0;
        
        // Base score for being active
        score += 1;
        
        // Bonus for having specialties
        if (coach.specialties && coach.specialties.length > 0) {
          score += coach.specialties.length * 0.5;
        }
        
        // Bonus for having past ratings
        if (coach.pastEventRatings && coach.pastEventRatings.length > 0) {
          const avgRating = coach.pastEventRatings.reduce((sum, rating) => sum + rating, 0) / coach.pastEventRatings.length;
          score += avgRating;
        }
        
        return { ...coach, matchScore: score };
      });

      // Sort by score and limit results
      const bestMatches = scoredCoaches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, parseInt(limit));

      res.json(bestMatches);
    } catch (error) {
      console.error("Coach match error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Coach Outreach Routes
  app.post("/api/coach-outreach/initiate", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can initiate outreach
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { eventId, coachIds, config = {} } = req.body;

      if (!eventId || !coachIds || !Array.isArray(coachIds)) {
        return res.status(400).json({ message: "Event ID and coach IDs are required" });
      }

      // Create outreach logs for each coach
      const logs = [];
      for (const coachId of coachIds) {
        const coach = await storage.getCoach(coachId);
        if (coach && coach.status === 'active') {
          const log = await storage.createCoachOutreachLog({
            eventId: parseInt(eventId),
            coachId: coachId,
            attemptNumber: 1,
            channel: coach.preferredChannel,
            messageId: `init-${Date.now()}-${coachId}`,
            response: null,
            responseDetails: null,
            remindersSent: 0
          });
          logs.push(log);
        }
      }

      res.json({ status: 'initiated', logs: logs.length });
    } catch (error) {
      console.error("Initiate outreach error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/coach-outreach/response", authenticateToken, async (req: any, res) => {
    try {
      const { eventId, coachId, response, responseDetails = null } = req.body;

      if (!eventId || !coachId || !response) {
        return res.status(400).json({ message: "Event ID, coach ID, and response are required" });
      }

      // Find the outreach log
      const logs = await storage.getCoachOutreachLogsByEvent(parseInt(eventId));
      const log = logs.find(l => l.coachId === parseInt(coachId) && !l.response);

      if (!log) {
        return res.status(404).json({ message: "Outreach log not found" });
      }

      // Update the log with the response
      await storage.updateCoachOutreachLog(log.id, {
        response: response,
        responseDetails: responseDetails
      });

      // If accepted, assign coach to event
      if (response === 'accept') {
        await storage.updateScheduleEvent(parseInt(eventId), {
          coach: `Coach ${coachId}` // In a real app, this would use the coach's name
        });
      }

      res.json({ status: 'updated' });
    } catch (error) {
      console.error("Handle response error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/coach-outreach/status", authenticateToken, async (req: any, res) => {
    try {
      const { eventId } = req.query;

      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      const logs = await storage.getCoachOutreachLogsByEvent(parseInt(eventId));
      
      // Enhance logs with coach information
      const enhancedLogs = await Promise.all(logs.map(async (log) => {
        const coach = await storage.getCoach(log.coachId);
        return {
          ...log,
          coachName: coach ? coach.name : `Coach ${log.coachId}`,
          coachEmail: coach ? coach.email : null
        };
      }));

      res.json(enhancedLogs);
    } catch (error) {
      console.error("Get outreach status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/coach-outreach/escalate", authenticateToken, async (req: any, res) => {
    try {
      // Only admins can escalate
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { eventId, config = {} } = req.body;
      const handOffAfter = config.handOffAfter || 7; // days

      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required" });
      }

      const logs = await storage.getCoachOutreachLogsByEvent(parseInt(eventId));
      const now = new Date();
      let escalatedCount = 0;

      for (const log of logs) {
        if (!log.response && log.timestamp) {
          const daysSinceContact = Math.floor((now.getTime() - new Date(log.timestamp).getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceContact >= handOffAfter) {
            await storage.updateCoachOutreachLog(log.id, {
              response: 'escalated',
              responseDetails: 'Automatically escalated due to no response'
            });
            escalatedCount++;
          }
        }
      }

      res.json({ status: 'escalated', count: escalatedCount });
    } catch (error) {
      console.error("Escalate outreach error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Document management API routes
  
  // Configure multer for document file uploads
  const documentStorage = multer.memoryStorage();
  const documentUpload = multer({ 
    storage: documentStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req: any, file: any, cb: any) => {
      // Accept PDF, DOC, DOCX files
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed.'), false);
      }
    }
  });

  // Ensure uploads directory exists
  const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  // Get all documents
  app.get("/api/documents", authenticateToken, async (req: any, res) => {
    try {
      const documents = await storage.getDocuments();
      
      // Filter documents based on user role
      const filteredDocuments = documents.filter(doc => {
        if (!doc.allowedRoles || doc.allowedRoles.length === 0) {
          return true; // No restrictions
        }
        return doc.allowedRoles.includes(req.user.role);
      });

      res.json(filteredDocuments);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get document by ID
  app.get("/api/documents/:id", authenticateToken, async (req: any, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check role permissions
      if (document.allowedRoles && document.allowedRoles.length > 0) {
        if (!document.allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      // Log the view action
      await storage.createDocumentAuditLog({
        documentId: document.id,
        userId: req.user.id,
        action: 'view',
        details: { userAgent: req.headers['user-agent'] },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json(document);
    } catch (error) {
      console.error("Failed to fetch document:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Upload new document
  app.post("/api/documents", authenticateToken, documentUpload.single('file'), async (req: any, res) => {
    try {
      // Only admins and managers can upload documents
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      const { title, description, version, allowedRoles, requiresSignature, expirationType, expirationDate } = req.body;

      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }

      // Save file to uploads directory
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const filePath = path.join(UPLOADS_DIR, fileName);
      fs.writeFileSync(filePath, req.file.buffer);

      // Parse allowed roles
      let parsedAllowedRoles = ["admin", "manager"];
      if (allowedRoles) {
        try {
          parsedAllowedRoles = JSON.parse(allowedRoles);
        } catch (e) {
          // Use default if parsing fails
        }
      }

      const document = await storage.createDocument({
        title,
        description: description || null,
        version: version || "1.0",
        fileName: req.file.originalname,
        filePath,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        expirationType: expirationType || "never",
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        allowedRoles: parsedAllowedRoles,
        requiresSignature: requiresSignature === 'true' || requiresSignature === true,
        status: "active"
      });

      // Log the upload action
      await storage.createDocumentAuditLog({
        documentId: document.id,
        userId: req.user.id,
        action: 'upload',
        details: { fileName: req.file.originalname, fileSize: req.file.size },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json(document);
    } catch (error) {
      console.error("Failed to upload document:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update document metadata
  app.put("/api/documents/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update documents
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const documentId = parseInt(req.params.id);
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.filePath;
      delete updateData.fileName;
      delete updateData.fileSize;
      delete updateData.mimeType;
      delete updateData.createdAt;

      const document = await storage.updateDocument(documentId, updateData);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Log the edit action
      await storage.createDocumentAuditLog({
        documentId: document.id,
        userId: req.user.id,
        action: 'edit',
        details: { updatedFields: Object.keys(updateData) },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json(document);
    } catch (error) {
      console.error("Failed to update document:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Download document file
  app.get("/api/documents/:id/download", authenticateToken, async (req: any, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check role permissions
      if (document.allowedRoles && document.allowedRoles.length > 0) {
        if (!document.allowedRoles.includes(req.user.role)) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      // Log the download action
      await storage.createDocumentAuditLog({
        documentId: document.id,
        userId: req.user.id,
        action: 'download',
        details: { fileName: document.fileName },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Send file
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', document.mimeType);
      res.sendFile(path.resolve(document.filePath));
    } catch (error) {
      console.error("Failed to download document:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete document
  app.delete("/api/documents/:id", authenticateToken, async (req: any, res) => {
    try {
      // Only admins can delete documents
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete file from filesystem
      try {
        fs.unlinkSync(document.filePath);
      } catch (fileError) {
        console.warn("Failed to delete file:", fileError);
      }

      const deleted = await storage.deleteDocument(documentId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete document" });
      }

      // Log the delete action
      await storage.createDocumentAuditLog({
        documentId: document.id,
        userId: req.user.id,
        action: 'delete',
        details: { fileName: document.fileName },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Failed to delete document:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get document signatures
  app.get("/api/documents/:id/signatures", authenticateToken, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const signatures = await storage.getDocumentSignatures(documentId);
      res.json(signatures);
    } catch (error) {
      console.error("Failed to fetch signatures:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sign document
  app.post("/api/documents/:id/sign", authenticateToken, async (req: any, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const { signatureData, signatureType } = req.body;

      if (!signatureData) {
        return res.status(400).json({ message: "Signature data is required" });
      }

      if (!req.user || !req.user.userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if user has already signed
      const existingSignature = await storage.getUserDocumentSignature(documentId, req.user.userId);
      if (existingSignature) {
        return res.status(400).json({ message: "Document already signed by this user" });
      }

      const signature = await storage.createDocumentSignature({
        documentId,
        userId: req.user.userId,
        signatureData,
        signatureType: signatureType || 'canvas',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Log the sign action
      await storage.createDocumentAuditLog({
        documentId: document.id,
        userId: req.user.userId,
        action: 'sign',
        details: { signatureType },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(201).json(signature);
    } catch (error) {
      console.error("Failed to sign document:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get document audit logs
  app.get("/api/documents/:id/audit", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can view audit logs
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const documentId = parseInt(req.params.id);
      const auditLogs = await storage.getDocumentAuditLogs(documentId);
      res.json(auditLogs);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Event Registration API endpoints
  app.post("/api/event-registrations", authenticateToken, async (req: any, res) => {
    try {
      // Only players and parents can register for events
      if (!["player", "parent"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const registrationData = {
        ...req.body,
        registeredBy: req.user.userId,
        status: 'registered',
        registrationFee: '25.00'
      };

      // Check if user already registered for this event
      const existingRegistration = await storage.getUserEventRegistration(
        registrationData.eventId, 
        req.user.userId
      );
      
      if (existingRegistration) {
        return res.status(400).json({ message: "You are already registered for this event" });
      }

      const registration = await storage.createEventRegistration(registrationData);
      res.status(201).json(registration);
    } catch (error) {
      console.error("Event registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/event-registrations/:eventId", authenticateToken, async (req: any, res) => {
    try {
      // Only admins, managers, and coaches can view registrations
      if (!["admin", "manager", "coach"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const eventId = parseInt(req.params.eventId);
      const registrations = await storage.getEventRegistrations(eventId);
      res.json(registrations);
    } catch (error) {
      console.error("Get event registrations error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/event-registrations/:id/status", authenticateToken, async (req: any, res) => {
    try {
      // Only admins and managers can update registration status
      if (!["admin", "manager"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const registrationId = parseInt(req.params.id);
      const { status } = req.body;

      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.updateEventRegistrationStatus(registrationId, status);
      res.json({ message: "Registration status updated successfully" });
    } catch (error) {
      console.error("Update registration status error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard Configuration Routes (Admin only)
  app.get("/api/admin/dashboard-widgets", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can access dashboard configuration
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      // Return default widgets for now (in real implementation, these would be stored in DB)
      const defaultWidgets = [
        { id: 1, name: "Members", component: "members", description: "Player and parent management", defaultRoles: ["admin", "manager"], isActive: true },
        { id: 2, name: "Training & Scheduling", component: "training", description: "Manage training sessions", defaultRoles: ["admin", "manager", "coach"], isActive: true },
        { id: 3, name: "Communication", component: "communication", description: "Team communication tools", defaultRoles: ["admin", "manager", "coach"], isActive: true },
        { id: 4, name: "Events", component: "events", description: "Event planning and budgeting", defaultRoles: ["admin", "manager"], isActive: true },
        { id: 5, name: "Coach Resources", component: "coach-resources", description: "Tools for coaching teams", defaultRoles: ["admin", "manager", "coach", "staff"], isActive: true },
        { id: 6, name: "Podcast", component: "podcast", description: "Volleyball podcast episodes", defaultRoles: ["admin", "manager", "coach", "player", "parent"], isActive: true },
        { id: 7, name: "Forms, Checklists & Reports", component: "forms", description: "Create forms and generate reports", defaultRoles: ["admin", "manager"], isActive: true },
        { id: 8, name: "Admin", component: "admin-settings", description: "System settings and user management", defaultRoles: ["admin"], isActive: true },
      ];

      res.json(defaultWidgets);
    } catch (error) {
      console.error("Get dashboard widgets error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/admin/role-permissions/:role", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can access role permissions
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { role } = req.params;
      
      // Return default permissions based on role (in real implementation, these would be stored in DB)
      const defaultPermissions = {
        admin: [
          { widgetId: 1, canView: true, canManage: true },
          { widgetId: 2, canView: true, canManage: true },
          { widgetId: 3, canView: true, canManage: true },
          { widgetId: 4, canView: true, canManage: true },
          { widgetId: 5, canView: true, canManage: true },
          { widgetId: 6, canView: true, canManage: true },
          { widgetId: 7, canView: true, canManage: true },
          { widgetId: 8, canView: true, canManage: true },
        ],
        manager: [
          { widgetId: 1, canView: true, canManage: true },
          { widgetId: 2, canView: true, canManage: true },
          { widgetId: 3, canView: true, canManage: true },
          { widgetId: 4, canView: true, canManage: true },
          { widgetId: 5, canView: true, canManage: false },
          { widgetId: 6, canView: true, canManage: false },
          { widgetId: 7, canView: true, canManage: true },
          { widgetId: 8, canView: false, canManage: false },
        ],
        coach: [
          { widgetId: 1, canView: true, canManage: false },
          { widgetId: 2, canView: true, canManage: false },
          { widgetId: 3, canView: true, canManage: false },
          { widgetId: 4, canView: true, canManage: false },
          { widgetId: 5, canView: true, canManage: false },
          { widgetId: 6, canView: true, canManage: false },
          { widgetId: 7, canView: false, canManage: false },
          { widgetId: 8, canView: false, canManage: false },
        ],
        staff: [
          { widgetId: 1, canView: false, canManage: false },
          { widgetId: 2, canView: false, canManage: false },
          { widgetId: 3, canView: false, canManage: false },
          { widgetId: 4, canView: false, canManage: false },
          { widgetId: 5, canView: true, canManage: false },
          { widgetId: 6, canView: true, canManage: false },
          { widgetId: 7, canView: false, canManage: false },
          { widgetId: 8, canView: false, canManage: false },
        ],
        player: [
          { widgetId: 1, canView: false, canManage: false },
          { widgetId: 2, canView: true, canManage: false },
          { widgetId: 3, canView: false, canManage: false },
          { widgetId: 4, canView: true, canManage: false },
          { widgetId: 5, canView: false, canManage: false },
          { widgetId: 6, canView: true, canManage: false },
          { widgetId: 7, canView: false, canManage: false },
          { widgetId: 8, canView: false, canManage: false },
        ],
        parent: [
          { widgetId: 1, canView: false, canManage: false },
          { widgetId: 2, canView: true, canManage: false },
          { widgetId: 3, canView: false, canManage: false },
          { widgetId: 4, canView: true, canManage: false },
          { widgetId: 5, canView: false, canManage: false },
          { widgetId: 6, canView: true, canManage: false },
          { widgetId: 7, canView: false, canManage: false },
          { widgetId: 8, canView: false, canManage: false },
        ],
      };

      res.json(defaultPermissions[role] || []);
    } catch (error) {
      console.error("Get role permissions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/admin/role-permissions", authenticateToken, async (req: any, res) => {
    try {
      // Only admin can update role permissions
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const { role, widgetId, canView, canManage } = req.body;

      // In a real implementation, this would update the database
      // For now, we'll just return success
      console.log(`Updated permissions for ${role} on widget ${widgetId}: view=${canView}, manage=${canManage}`);

      res.json({ 
        message: "Permissions updated successfully",
        role,
        widgetId,
        canView,
        canManage
      });
    } catch (error) {
      console.error("Update role permissions error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
