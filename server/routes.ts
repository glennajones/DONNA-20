import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pusher } from "./pusher";
import { loginSchema, insertRegistrationSchema, insertPaymentSchema, insertScheduleEventSchema, insertPlayerSchema, insertParentSchema, insertEventSchema, insertEvaluationSchema, insertGoogleCalendarTokenSchema, insertPodcastEpisodeSchema, insertPodcastCommentSchema, insertPodcastPollVoteSchema } from "@shared/schema";
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
      // Only coaches, managers, and admins can view schedules
      if (!["admin", "manager", "coach"].includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const { from, to } = req.query;
      const events = await storage.getScheduleEvents(from as string, to as string);
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
      const { action, timestamp } = req.body;
      
      await storage.createTimeClockEntry({
        userId: req.user.userId,
        action,
        timestamp: new Date(timestamp)
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Time clock error:', error);
      res.status(500).json({ error: 'Failed to record time' });
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



  const httpServer = createServer(app);
  return httpServer;
}
