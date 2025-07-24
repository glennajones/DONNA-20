import { storage } from '../storage';
import { sendEventNotifications } from './communicationService';

interface ScheduledReminder {
  eventId: number;
  reminderTime: Date;
  timeoutId?: NodeJS.Timeout;
}

// In-memory store for scheduled reminders
// In production, this would be replaced with a proper job queue like Bull/Agenda
const scheduledReminders = new Map<number, ScheduledReminder>();

export function scheduleReminder(eventId: number, reminderTime: Date): boolean {
  const now = new Date();
  
  // Don't schedule if time is in the past
  if (reminderTime <= now) {
    console.log(`Reminder time for event ${eventId} is in the past, skipping`);
    return false;
  }

  // Cancel existing reminder if any
  cancelReminder(eventId);

  const delay = reminderTime.getTime() - now.getTime();
  
  const timeoutId = setTimeout(async () => {
    try {
      await sendScheduledReminder(eventId);
      scheduledReminders.delete(eventId);
    } catch (error) {
      console.error(`Failed to send scheduled reminder for event ${eventId}:`, error);
    }
  }, delay);

  scheduledReminders.set(eventId, {
    eventId,
    reminderTime,
    timeoutId
  });

  console.log(`Reminder scheduled for event ${eventId} at ${reminderTime.toISOString()}`);
  return true;
}

export function cancelReminder(eventId: number): boolean {
  const reminder = scheduledReminders.get(eventId);
  if (reminder && reminder.timeoutId) {
    clearTimeout(reminder.timeoutId);
    scheduledReminders.delete(eventId);
    console.log(`Cancelled reminder for event ${eventId}`);
    return true;
  }
  return false;
}

export function getScheduledReminders(): ScheduledReminder[] {
  return Array.from(scheduledReminders.values()).map(r => ({
    eventId: r.eventId,
    reminderTime: r.reminderTime
  }));
}

async function sendScheduledReminder(eventId: number) {
  try {
    // Get event details
    const event = await storage.getEvent(eventId);
    if (!event) {
      console.error(`Event ${eventId} not found for scheduled reminder`);
      return;
    }

    // Get users who should receive the reminder
    const eligibleUsers = await storage.getUsersByRoles(event.visibleToRoles || []);
    
    // Filter users with contact info
    const notifiableUsers = eligibleUsers.filter(user => 
      user.email || user.phone
    );

    if (notifiableUsers.length === 0) {
      console.log(`No users to notify for event ${event.name} reminder`);
      return;
    }

    // Send reminder notifications
    const result = await sendEventNotifications({
      event,
      users: notifiableUsers,
      commMethodOverride: event.commMethodOverride || 'respect_user_pref',
      sendEmailNotifications: true,
      sendSMSNotifications: true,
      isReminder: true
    });

    console.log(`Reminder sent for "${event.name}": ${result.sent} messages, ${result.errors.length} errors`);

  } catch (error) {
    console.error(`Error sending scheduled reminder for event ${eventId}:`, error);
  }
}

// Calculate reminder time based on event and schedule setting
export function calculateReminderTime(event: any): Date | null {
  if (!event.reminderSchedule || event.reminderSchedule === 'none') {
    return null;
  }

  const eventDateTime = new Date(`${event.startDate}T${event.startTime || '00:00'}`);
  
  switch (event.reminderSchedule) {
    case '1_hour':
      return new Date(eventDateTime.getTime() - 60 * 60 * 1000);
    case '4_hours':
      return new Date(eventDateTime.getTime() - 4 * 60 * 60 * 1000);
    case '1_day':
      return new Date(eventDateTime.getTime() - 24 * 60 * 60 * 1000);
    case '3_days':
      return new Date(eventDateTime.getTime() - 3 * 24 * 60 * 60 * 1000);
    case '1_week':
      return new Date(eventDateTime.getTime() - 7 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

// Cleanup expired reminders (called periodically)
export function cleanupExpiredReminders() {
  const now = new Date();
  let cleaned = 0;
  
  const entries = Array.from(scheduledReminders.entries());
  for (const [eventId, reminder] of entries) {
    if (reminder.reminderTime <= now) {
      cancelReminder(eventId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired reminders`);
  }
}

// Initialize cleanup interval (runs every hour)
setInterval(cleanupExpiredReminders, 60 * 60 * 1000);