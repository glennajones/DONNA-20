import { db } from '../db';
import { events, scheduleEvents } from '../../shared/schema';
import { eq } from 'drizzle-orm';

export interface NextDayEventsResult {
  courtEvents: any[];
  personalEvents: any[];
  scheduleEvents: any[];
}

export async function getNextDayEvents(adminId: number): Promise<NextDayEventsResult> {
  const now = new Date();
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const tomorrowEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 0, 0, 0);
  
  // Format dates for comparison (YYYY-MM-DD)
  const tomorrowDateStr = tomorrowStart.toISOString().split('T')[0];

  try {
    // Get Events (from Events & Budgeting system) for tomorrow
    const eventResults = await db.select().from(events).where(
      eq(events.date, tomorrowDateStr)
    );

    // Separate court events and personal events
    const courtEvents = eventResults.filter(event => 
      ['Practice', 'Tournament', 'Camp', 'Team Camp'].includes(event.eventType) &&
      event.location && event.location.trim() !== ''
    );

    const personalEvents = eventResults.filter(event => 
      ['Social'].includes(event.eventType) ||
      (event.createdBy === adminId && (!event.location || event.location.trim() === ''))
    );

    // Get Schedule Events (from Training & Scheduling system) for tomorrow
    const scheduleResults = await db.select().from(scheduleEvents).where(
      eq(scheduleEvents.date, tomorrowDateStr)
    );

    return {
      courtEvents,
      personalEvents,
      scheduleEvents: scheduleResults
    };
  } catch (error) {
    console.error('Error fetching next day events:', error);
    return {
      courtEvents: [],
      personalEvents: [],
      scheduleEvents: []
    };
  }
}