import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import buildEventTemplate from './eventEmailTemplate';
import { buildMagicLink } from './magicLinks';
import { storage } from '../storage';

// Initialize SendGrid (will be set via environment variable)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio (will be set via environment variables)
let twilioClient: any = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

interface NotificationData {
  event: any;
  users: any[];
  commMethodOverride: string;
  sendEmailNotifications: boolean;
  sendSMSNotifications: boolean;
  isReminder?: boolean;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendEventNotifications(data: NotificationData) {
  const { event, users, commMethodOverride, sendEmailNotifications, sendSMSNotifications } = data;
  
  if (!sendEmailNotifications && !sendSMSNotifications) {
    console.log('No notification methods enabled for event:', event.name);
    return { success: true, sent: 0, errors: [] };
  }

  const results = {
    success: true,
    sent: 0,
    errors: [] as string[]
  };

  for (const user of users) {
    try {
      // Determine which communication methods to use
      const shouldSendEmail = sendEmailNotifications && shouldUseMethod('email', user.communicationPreference, commMethodOverride);
      const shouldSendSMS = sendSMSNotifications && shouldUseMethod('sms', user.communicationPreference, commMethodOverride);

      if (shouldSendEmail && user.email) {
        const emailResult = await sendEmail(user, event, data.isReminder);
        if (emailResult.success) {
          results.sent++;
          // Log the message
          await storage.createMessageLog({
            eventId: event.id,
            userId: user.id,
            channel: 'email',
            status: 'sent',
            messageId: emailResult.messageId || null
          });
        } else {
          results.errors.push(`Email failed for ${user.username}: ${emailResult.error}`);
          await storage.createMessageLog({
            eventId: event.id,
            userId: user.id,
            channel: 'email',
            status: 'failed',
            errorMessage: emailResult.error
          });
        }
      }

      if (shouldSendSMS && user.phone) {
        const smsResult = await sendSMS(user, event, data.isReminder);
        if (smsResult.success) {
          results.sent++;
          // Log the message
          await storage.createMessageLog({
            eventId: event.id,
            userId: user.id,
            channel: 'sms',
            status: 'sent',
            messageId: smsResult.messageId || null
          });
        } else {
          results.errors.push(`SMS failed for ${user.username}: ${smsResult.error}`);
          await storage.createMessageLog({
            eventId: event.id,
            userId: user.id,
            channel: 'sms',
            status: 'failed',
            errorMessage: smsResult.error
          });
        }
      }

    } catch (error) {
      console.error(`Failed to send notification to user ${user.id}:`, error);
      results.errors.push(`Failed to notify ${user.username}: ${error}`);
    }
  }

  return results;
}

function shouldUseMethod(method: string, userPreference: string, override: string): boolean {
  // Handle communication method override logic
  switch (override) {
    case 'email_only':
      return method === 'email';
    case 'sms_only':
      return method === 'sms';
    case 'groupme_only':
      return method === 'groupme';
    case 'all':
      return true;
    case 'respect_user_pref':
    default:
      // Respect user's communication preference
      if (!userPreference) return true; // Default to all methods if no preference
      
      // Map user preferences to methods
      const preferenceMap: { [key: string]: string[] } = {
        'Email': ['email'],
        'SMS': ['sms'],
        'GroupMe': ['groupme'],
        'Email + SMS': ['email', 'sms'],
        'Email + GroupMe': ['email', 'groupme'],
        'SMS + GroupMe': ['sms', 'groupme'],
        'All': ['email', 'sms', 'groupme']
      };
      
      const allowedMethods = preferenceMap[userPreference] || ['email', 'sms'];
      return allowedMethods.includes(method);
  }
}

async function sendEmail(user: any, event: any, isReminder = false): Promise<EmailResult> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid not configured - would send email to:', user.email);
    return { success: true, messageId: `sim_${Date.now()}` };
  }

  try {
    let emailContent = buildEventTemplate(event);
    
    // Add magic link if acknowledgements are required
    if (event.acknowledgementsRequired) {
      const magicLink = buildMagicLink(user.id, event.id);
      emailContent += `
        <div style="margin-top: 30px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #3b82f6;">
          <h3 style="color: #1e40af; margin: 0 0 10px 0;">Acknowledgement Required</h3>
          <p style="margin: 0 0 15px 0;">Please acknowledge receipt of this event notification by clicking the link below:</p>
          <a href="${magicLink}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
            ✅ Acknowledge Event
          </a>
          <p style="margin: 15px 0 0 0; font-size: 12px; color: #6b7280;">This link will expire in 7 days.</p>
        </div>
      `;
    }
    
    const subject = isReminder ? `Reminder: ${event.name}` : `📅 Event Notification: ${event.name}`;
    
    const msg = {
      to: user.email,
      from: process.env.FROM_EMAIL || 'noreply@volleyclubpro.com',
      subject,
      html: emailContent,
    };

    const response = await sgMail.send(msg);
    const messageId = response[0]?.headers?.['x-message-id'] || `email_${Date.now()}`;
    
    console.log(`Email sent to ${user.email} for event: ${event.name}`);
    return { success: true, messageId };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: String(error) };
  }
}

async function sendSMS(user: any, event: any, isReminder = false): Promise<SMSResult> {
  if (!twilioClient) {
    console.log('Twilio not configured - would send SMS to:', user.phone);
    return { success: true, messageId: `sim_sms_${Date.now()}` };
  }

  try {
    let smsContent = `🏐 ${isReminder ? 'REMINDER' : 'EVENT'}: ${event.name}\n📅 ${new Date(event.startDate).toLocaleDateString()}\n🕐 ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\n📍 ${event.location || 'TBD'}`;
    
    // Add magic link if acknowledgements are required
    if (event.acknowledgementsRequired) {
      const magicLink = buildMagicLink(user.id, event.id);
      smsContent += `\n\n✅ Acknowledge: ${magicLink}`;
    }
    
    smsContent += '\n\nSee you there!';

    const message = await twilioClient.messages.create({
      body: smsContent,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone
    });
    
    console.log(`SMS sent to ${user.phone} for event: ${event.name}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { success: false, error: String(error) };
  }
}

// Enhanced function to schedule reminders using the reminder scheduler
export async function scheduleEventReminders(event: any, users: any[]) {
  if (!event.reminderSchedule || event.reminderSchedule === 'none') {
    return { scheduled: 0 };
  }

  // Import and use the dedicated reminder scheduler
  const { scheduleReminder, calculateReminderTime } = await import('./reminderScheduler');
  
  const reminderTime = calculateReminderTime(event);
  if (!reminderTime) {
    return { scheduled: 0 };
  }

  const success = scheduleReminder(event.id, reminderTime);
  
  return { 
    scheduled: success ? users.length : 0,
    reminderTime: reminderTime.toISOString()
  };
}