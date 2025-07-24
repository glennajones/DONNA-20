import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import buildEventTemplate from './eventEmailTemplate';

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
        await sendEmail(user, event);
        results.sent++;
      }

      if (shouldSendSMS && user.phone) {
        await sendSMS(user, event);
        results.sent++;
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

async function sendEmail(user: any, event: any) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid not configured - would send email to:', user.email);
    return; // Mock send in development
  }

  const emailContent = buildEventTemplate(event);
  
  const msg = {
    to: user.email,
    from: process.env.FROM_EMAIL || 'noreply@volleyclubpro.com',
    subject: `📅 Event Notification: ${event.name}`,
    html: emailContent,
  };

  await sgMail.send(msg);
  console.log(`Email sent to ${user.email} for event: ${event.name}`);
}

async function sendSMS(user: any, event: any) {
  if (!twilioClient) {
    console.log('Twilio not configured - would send SMS to:', user.phone);
    return; // Mock send in development
  }

  const smsContent = `🏐 VolleyClub Pro Event: ${event.name}\n📅 ${new Date(event.startDate).toLocaleDateString()}\n🕐 ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}\n📍 ${event.location || 'TBD'}\n\nSee you there!`;

  await twilioClient.messages.create({
    body: smsContent,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: user.phone
  });
  
  console.log(`SMS sent to ${user.phone} for event: ${event.name}`);
}