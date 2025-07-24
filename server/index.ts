import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cron from 'node-cron';
import { getNextDayEvents } from './utils/getNextDayEvents';
import adminDailyEmailTemplate from './utils/adminDailyEmailTemplate';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Setup daily email cron job for admins
  setupDailyEmailCron();
})();

// Daily email cron job function
async function setupDailyEmailCron() {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SENDGRID_API_KEY not found - daily emails disabled');
    return;
  }

  const { default: sgMail } = await import('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Run every day at 6:00 PM (18:00)
  cron.schedule('0 18 * * *', async () => {
    console.log('📧 Running admin daily email cron...');
    
    try {
      // Import storage here to avoid circular dependency
      const { storage } = await import('./storage');
      
      // Fetch all admin users
      const admins = await storage.getUsersByRole('admin');
      
      for (const admin of admins) {
        if (!admin.email) {
          console.log(`Admin ${admin.name} has no email address, skipping`);
          continue;
        }

        // Get tomorrow's events
        const { courtEvents, personalEvents, scheduleEvents } = await getNextDayEvents(admin.id);
        
        // Generate email template
        const html = adminDailyEmailTemplate(courtEvents, personalEvents, scheduleEvents);
        
        // Send email
        try {
          await sgMail.send({
            to: admin.email,
            from: 'noreply@volleyclubpro.com',
            subject: '📅 Tomorrow\'s Schedule - VolleyClub Pro',
            html
          });
          
          console.log(`Daily schedule email sent to ${admin.email}`);
        } catch (emailError) {
          console.error(`Failed to send email to ${admin.email}:`, emailError);
        }
      }
    } catch (error) {
      console.error('Error in daily email cron job:', error);
    }
  });

  console.log('📧 Daily email cron job scheduled for 6:00 PM');
}
