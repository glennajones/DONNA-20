/**
 * Time utility functions for converting between 24-hour (military) and 12-hour (AM/PM) formats
 */

// Convert 24-hour time string (HH:MM) to 12-hour format with AM/PM
export function formatTime24To12(timeStr: string): string {
  if (!timeStr) return "";
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Convert 12-hour time with AM/PM to 24-hour format (HH:MM)
export function formatTime12To24(timeStr: string): string {
  if (!timeStr) return "";
  
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return timeStr; // Return as-is if format doesn't match
  
  let [, hours, minutes, period] = match;
  let hour24 = parseInt(hours);
  
  if (period.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
}

// Generate time options for 12-hour format dropdowns
export function generateTimeOptions(): string[] {
  const times = [];
  
  for (let hour = 1; hour <= 12; hour++) {
    for (let minute = 0; minute < 60; minute += 15) { // 15-minute intervals
      const timeAM = `${hour}:${minute.toString().padStart(2, '0')} AM`;
      const timePM = `${hour}:${minute.toString().padStart(2, '0')} PM`;
      times.push(timeAM);
      if (hour !== 12 || minute !== 0) { // Don't duplicate 12:00 PM
        times.push(timePM);
      }
    }
  }
  
  // Sort times chronologically
  return times.sort((a, b) => {
    const time24A = formatTime12To24(a);
    const time24B = formatTime12To24(b);
    return time24A.localeCompare(time24B);
  });
}

// Parse various time formats and return 12-hour format
export function parseTimeToDisplay(timeStr: string): string {
  if (!timeStr) return "";
  
  // If already in 12-hour format, return as-is
  if (timeStr.match(/\d{1,2}:\d{2}\s*(AM|PM)/i)) {
    return timeStr;
  }
  
  // If in 24-hour format, convert
  if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
    return formatTime24To12(timeStr);
  }
  
  return timeStr;
}

// Get current time in 12-hour format
export function getCurrentTime12(): string {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return formatTime24To12(timeStr);
}