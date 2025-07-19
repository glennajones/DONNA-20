import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pusher } from "./pusher";
import { loginSchema, insertRegistrationSchema, insertPaymentSchema, insertScheduleEventSchema, insertPlayerSchema, insertParentSchema } from "@shared/schema";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "volleyball-club-secret-key";

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

  const httpServer = createServer(app);
  return httpServer;
}
