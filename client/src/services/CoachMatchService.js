// Coach Matching Service - finds best coaches for events based on various criteria
import { apiRequest } from "@/lib/queryClient";

export async function findBestCoaches(eventId, options = {}) {
  const limit = options.limit || 5;
  
  try {
    const response = await apiRequest(`/api/coach-match?eventId=${eventId}&limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Error finding best coaches:', error);
    throw error;
  }
}

export function calculateMatchScore(coach, event) {
  let score = 0;
  
  // Match specialties (highest priority)
  if (event.requiredSkills && coach.specialties) {
    const matchedSpecialties = coach.specialties.filter(specialty => 
      event.requiredSkills.includes(specialty)
    ).length;
    score += matchedSpecialties * 3;
  }
  
  // Check availability overlap
  if (coach.availabilityWindows && event.dateRange) {
    const hasAvailability = coach.availabilityWindows.some(window => {
      return new Date(window.start) <= new Date(event.dateRange.end) && 
             new Date(window.end) >= new Date(event.dateRange.start);
    });
    if (hasAvailability) score += 2;
  }
  
  // Average past ratings
  if (coach.pastEventRatings && coach.pastEventRatings.length > 0) {
    const avgRating = coach.pastEventRatings.reduce((sum, rating) => sum + rating, 0) / coach.pastEventRatings.length;
    score += avgRating;
  }
  
  // Location proximity (if both have locations)
  if (coach.location && event.location && coach.location === event.location) {
    score += 1;
  }
  
  return score;
}

export function formatCoachForDisplay(coach) {
  return {
    ...coach,
    averageRating: coach.pastEventRatings && coach.pastEventRatings.length > 0 
      ? (coach.pastEventRatings.reduce((sum, rating) => sum + rating, 0) / coach.pastEventRatings.length).toFixed(1)
      : 'N/A',
    specialtiesDisplay: coach.specialties ? coach.specialties.join(', ') : 'None listed'
  };
}