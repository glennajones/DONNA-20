import { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
}
import { getNextDayEvents } from '../utils/getNextDayEvents';
import adminDailyEmailTemplate from '../utils/adminDailyEmailTemplate';

export async function testDailyEmail(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Get tomorrow's events for this admin
    const { courtEvents, personalEvents, scheduleEvents } = await getNextDayEvents(req.user.id);
    
    // Generate email template
    const html = adminDailyEmailTemplate(courtEvents, personalEvents, scheduleEvents);
    
    // For testing, return the HTML template
    res.json({
      message: 'Daily email template generated successfully',
      eventCounts: {
        courtEvents: courtEvents.length,
        personalEvents: personalEvents.length,
        scheduleEvents: scheduleEvents.length
      },
      html: html
    });
    
  } catch (error) {
    console.error('Error generating daily email:', error);
    res.status(500).json({ message: 'Failed to generate daily email' });
  }
}

export async function triggerDailyEmail(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    if (!process.env.SENDGRID_API_KEY) {
      return res.status(500).json({ message: 'SendGrid API key not configured' });
    }

    const { default: sgMail } = await import('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    // Import storage here to avoid circular dependency
    const { storage } = await import('../storage');
    
    // Fetch all admin users
    const admins = await storage.getUsersByRole('admin');
    
    const results = [];
    
    for (const admin of admins) {
      if (!admin.email) {
        results.push({ admin: admin.name, status: 'skipped', reason: 'No email address' });
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
        
        results.push({ admin: admin.name, status: 'sent', email: admin.email });
      } catch (emailError: any) {
        console.error(`Failed to send email to ${admin.email}:`, emailError);
        results.push({ admin: admin.name, status: 'failed', error: emailError?.message || 'Unknown error' });
      }
    }

    res.json({
      message: 'Daily email trigger completed',
      results
    });
    
  } catch (error) {
    console.error('Error triggering daily email:', error);
    res.status(500).json({ message: 'Failed to trigger daily email' });
  }
}