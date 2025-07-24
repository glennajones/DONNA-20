import { storage } from '../storage';
import { eq, sql } from 'drizzle-orm';

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
    const allEvents = await storage.getEvents();
    const eventResults = allEvents.filter(event => event.start_date === tomorrowDateStr);

    // Separate court events and personal events
    const courtEvents = eventResults.filter(event => 
      ['Practice', 'Tournament', 'Camp', 'Team Camp'].includes(event.eventType || '') &&
      event.location && event.location.trim() !== ''
    );

    const personalEvents = eventResults.filter(event => 
      ['Social'].includes(event.eventType || '') ||
      (event.createdBy === adminId && (!event.location || event.location.trim() === ''))
    );

    // Get Schedule Events (from Training & Scheduling system) for tomorrow
    const allScheduleEvents = await storage.getScheduleEvents();
    const scheduleResults = allScheduleEvents.filter(event => event.date === tomorrowDateStr);

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