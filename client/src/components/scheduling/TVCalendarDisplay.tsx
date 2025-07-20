import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScheduleEvent } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Calendar, Clock, MapPin } from "lucide-react";

// Event type colors for TV display - higher contrast
const getEventColor = (eventType: string) => {
  const colorMap: Record<string, string> = {
    "Practice": "#2563EB",      // Stronger blue
    "School Activity": "#059669", // Stronger green
    "Tournament": "#DC2626",     // Strong red
    "Camp": "#7C3AED",          // Strong purple
    "Team Camp": "#EA580C",     // Strong orange
    "Social": "#DB2777"         // Strong pink
  };
  return colorMap[eventType] || "#2563EB";
};

interface TVCalendarDisplayProps {
  date?: Date;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds, default 30
}

export default function TVCalendarDisplay({ 
  date = new Date(), 
  autoRefresh = true, 
  refreshInterval = 30 
}: TVCalendarDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate] = useState(date);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh data
  const dateStr = selectedDate.toISOString().split('T')[0];
  const { data: scheduleData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/schedule', dateStr],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/schedule?from=${dateStr}&to=${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch schedule data');
      }
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });

  const events = scheduleData?.events || [];
  const todayEvents = events.filter((e: ScheduleEvent) => e.date === dateStr);

  // Sort events by time
  const sortedEvents = todayEvents.sort((a: ScheduleEvent, b: ScheduleEvent) => {
    const [aHours, aMinutes] = a.time.split(':').map(Number);
    const [bHours, bMinutes] = b.time.split(':').map(Number);
    const aTimeMinutes = aHours * 60 + aMinutes;
    const bTimeMinutes = bHours * 60 + bMinutes;
    return aTimeMinutes - bTimeMinutes;
  });

  // Get current and upcoming events
  const now = currentTime;
  const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
  
  const currentEvent = sortedEvents.find((event: ScheduleEvent) => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const eventStart = hours * 60 + minutes;
    const eventEnd = eventStart + (event.duration || 120);
    return currentTimeMinutes >= eventStart && currentTimeMinutes < eventEnd;
  });

  const upcomingEvents = sortedEvents.filter((event: ScheduleEvent) => {
    const [hours, minutes] = event.time.split(':').map(Number);
    const eventStart = hours * 60 + minutes;
    return eventStart > currentTimeMinutes;
  }).slice(0, 6); // Show next 6 events

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = () => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <div className="text-4xl font-light">Loading Schedule...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 text-red-400">⚠️</div>
          <div className="text-4xl font-light text-red-400">Unable to load schedule</div>
          <div className="text-2xl mt-4 text-gray-400">Please check connection</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header with current time and date */}
      <div className="mb-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Calendar className="h-16 w-16 text-blue-400" />
            <div>
              <h1 className="text-6xl font-bold text-blue-400">VolleyClub Pro</h1>
              <p className="text-3xl text-gray-300 mt-2">Daily Schedule</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-7xl font-mono font-bold text-green-400">
              {formatCurrentTime()}
            </div>
            <div className="text-3xl text-gray-300 mt-2">
              {formatDate()}
            </div>
          </div>
        </div>
      </div>

      {/* Current Event Section */}
      {currentEvent && (
        <div className="mb-12">
          <Card className="bg-green-800 border-green-600 border-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-4xl font-bold text-green-100 flex items-center gap-4">
                <div className="w-6 h-6 bg-green-400 rounded-full animate-pulse"></div>
                NOW HAPPENING
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-5xl font-bold text-white mb-2">
                    {currentEvent.title}
                  </div>
                  <div className="flex items-center gap-3 text-2xl text-green-200">
                    <Clock className="h-6 w-6" />
                    {formatTime(currentEvent.time)} - {(() => {
                      const [hours, minutes] = currentEvent.time.split(':').map(Number);
                      const endMinutes = hours * 60 + minutes + (currentEvent.duration || 120);
                      const endHours = Math.floor(endMinutes / 60);
                      const endMins = endMinutes % 60;
                      return formatTime(`${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`);
                    })()}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 text-2xl text-green-200 mb-4">
                    <MapPin className="h-6 w-6" />
                    {currentEvent.court}
                  </div>
                  {currentEvent.coach && (
                    <div className="text-xl text-green-300">
                      Coach: {currentEvent.coach}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-right">
                    <span className="inline-block px-4 py-2 text-xl font-semibold rounded-full text-white"
                          style={{ backgroundColor: getEventColor(currentEvent.eventType || "Practice") }}>
                      {currentEvent.eventType}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upcoming Events */}
      <div>
        <h2 className="text-4xl font-bold mb-8 text-gray-100 flex items-center gap-4">
          <Clock className="h-10 w-10 text-blue-400" />
          Upcoming Events
        </h2>
        
        {upcomingEvents.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-12">
              <div className="text-center text-3xl text-gray-400">
                No more events scheduled for today
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {upcomingEvents.map((event: ScheduleEvent, index: number) => (
              <Card key={event.id} className="bg-gray-800 border-gray-700 hover:bg-gray-750 transition-colors">
                <CardContent className="py-6">
                  <div className="grid grid-cols-4 gap-6 items-center">
                    <div className="text-3xl font-mono font-bold text-blue-400">
                      {formatTime(event.time)}
                    </div>
                    <div>
                      <div className="text-2xl font-semibold text-white mb-1">
                        {event.title}
                      </div>
                      {event.coach && (
                        <div className="text-lg text-gray-400">
                          {event.coach}
                        </div>
                      )}
                    </div>
                    <div className="text-xl text-gray-300 flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {event.court}
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 text-lg font-medium rounded-full text-white"
                            style={{ backgroundColor: getEventColor(event.eventType || "Practice") }}>
                        {event.eventType}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-600">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-300">Auto-refresh every {refreshInterval}s</span>
        </div>
      )}
    </div>
  );
}