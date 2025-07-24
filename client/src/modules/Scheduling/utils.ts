export const COURTS = [
  'Court 1', 'Court 2', 'Court 3', 'Court 4',
  'Court 5', 'Court 6', 'Court 7', 'Beach 1', 'Beach 2'
];

export function generateTimeSlots(startHour = 7, endHour = 21, interval = 30) {
  const slots: string[] = [];
  const base = new Date();
  base.setSeconds(0); 
  base.setMilliseconds(0);
  
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const t = new Date(base);
      t.setHours(h, m, 0, 0);
      slots.push(t.toTimeString().slice(0, 5)); // "HH:MM"
    }
  }
  return slots;
}

export const TIME_SLOTS = generateTimeSlots();

export function getSlotForEvent(ev: any) {
  // Handle both start_time and time fields for compatibility
  const timeValue = ev.start_time || ev.time;
  if (!timeValue) return '07:00';
  
  // If it's already in HH:MM format, return it
  if (typeof timeValue === 'string' && timeValue.match(/^\d{2}:\d{2}$/)) {
    return timeValue;
  }
  
  // If it's a date string or Date object, extract time
  return new Date(timeValue).toTimeString().slice(0, 5);
}

export function durationInSlots(start: string | Date, end: string | Date) {
  const startTime = new Date(start);
  const endTime = new Date(end);
  const mins = (endTime.getTime() - startTime.getTime()) / 60000;
  return Math.max(1, Math.round(mins / 30)); // 30-min slots
}

export function getEventColor(eventType: string) {
  switch (eventType?.toLowerCase()) {
    case 'training':
    case 'practice':
      return 'bg-blue-500';
    case 'match':
    case 'tournament':
      return 'bg-red-500';
    case 'camp':
    case 'team camp':
      return 'bg-purple-500';
    case 'social':
      return 'bg-green-500';
    case 'school activity':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}