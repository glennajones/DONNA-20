import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertRegistrationSchema, insertPaymentSchema, insertScheduleEventSchema } from "@shared/schema";
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

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
      }
      req.user = user;
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

  const httpServer = createServer(app);
  return httpServer;
}
