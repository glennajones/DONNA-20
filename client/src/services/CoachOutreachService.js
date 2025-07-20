// Coach Outreach Service - handles automated communication with coaches
import { apiRequest } from "@/lib/queryClient";

export async function initiateOutreach(eventId, coachIds, config = {}) {
  const defaultConfig = {
    reminders: [1, 3, 5], // days to send reminders
    templates: {
      initial: "Hi {{coachName}}, we have a volleyball {{eventType}} event on {{eventDate}} at {{eventLocation}}. Are you available to coach? Please respond: {{responseLink}}",
      reminder: "Hi {{coachName}}, just following up on the coaching opportunity for {{eventName}} on {{eventDate}}. Please let us know: {{responseLink}}"
    },
    handOffAfter: 7 // days before escalating
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  try {
    const response = await apiRequest('/api/coach-outreach/initiate', {
      method: 'POST',
      body: JSON.stringify({
        eventId,
        coachIds,
        config: finalConfig
      })
    });
    return response;
  } catch (error) {
    console.error('Error initiating outreach:', error);
    throw error;
  }
}

export async function handleCoachResponse(eventId, coachId, response, responseDetails = null) {
  try {
    const result = await apiRequest('/api/coach-outreach/response', {
      method: 'POST',
      body: JSON.stringify({
        eventId,
        coachId,
        response,
        responseDetails
      })
    });
    return result;
  } catch (error) {
    console.error('Error handling coach response:', error);
    throw error;
  }
}

export async function getOutreachStatus(eventId) {
  try {
    const response = await apiRequest(`/api/coach-outreach/status?eventId=${eventId}`);
    return response;
  } catch (error) {
    console.error('Error getting outreach status:', error);
    throw error;
  }
}

export async function escalateUnanswered(eventId, config = {}) {
  const defaultConfig = {
    handOffAfter: 7 // days
  };
  
  const finalConfig = { ...defaultConfig, ...config };
  
  try {
    const response = await apiRequest('/api/coach-outreach/escalate', {
      method: 'POST',
      body: JSON.stringify({
        eventId,
        config: finalConfig
      })
    });
    return response;
  } catch (error) {
    console.error('Error escalating unanswered outreach:', error);
    throw error;
  }
}

export function formatOutreachLog(log) {
  return {
    ...log,
    statusDisplay: getStatusDisplay(log.response),
    timeAgo: getTimeAgo(log.timestamp),
    channelDisplay: log.channel.charAt(0).toUpperCase() + log.channel.slice(1)
  };
}

function getStatusDisplay(response) {
  switch (response) {
    case 'accept': return 'Accepted';
    case 'decline': return 'Declined';
    case 'escalated': return 'Escalated';
    case null: 
    case undefined: return 'Pending';
    default: return response;
  }
}

function getTimeAgo(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const now = new Date();
  const then = new Date(timestamp);
  const diffInHours = Math.floor((now - then) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Less than an hour ago';
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
}