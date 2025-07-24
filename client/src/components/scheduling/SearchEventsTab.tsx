import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, Calendar, MapPin, Users, Clock, Info, UserPlus } from "lucide-react";
import { ScheduleEvent } from "@shared/schema";
import { useAuth } from "@/lib/auth";

// Event type colors
const getEventColor = (eventType: string) => {
  const colorMap: Record<string, string> = {
    "Practice": "#56A0D3",
    "School Activity": "#10B981", 
    "Tournament": "#FF0000",
    "Camp": "#8B5CF6",
    "Team Camp": "#FFA500",
    "Social": "#EC4899",
    "training": "#34d399",
    "match": "#60a5fa", 
    "tournament": "#f59e0b",
    "practice": "#8b5cf6",
    "tryout": "#ef4444",
    "camp": "#06b6d4",
    "social": "#ec4899"
  };
  return colorMap[eventType] || "#56A0D3";
};

export default function SearchEventsTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const { user } = useAuth();

  // Fetch all schedule events
  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: ["/api/schedule"],
    queryFn: async () => {
      const response = await fetch("/api/schedule", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch schedule");
      return response.json();
    },
  });

  const allEvents = scheduleData?.events || [];

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return allEvents;
    }
    
    const query = searchQuery.toLowerCase();
    return allEvents.filter((event: ScheduleEvent) => 
      event.title?.toLowerCase().includes(query) ||
      event.coach?.toLowerCase().includes(query) ||
      event.court?.toLowerCase().includes(query) ||
      event.eventType?.toLowerCase().includes(query) ||
      event.description?.toLowerCase().includes(query) ||
      event.location?.toLowerCase().includes(query)
    );
  }, [allEvents, searchQuery]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, ScheduleEvent[]> = {};
    filteredEvents.forEach((event: ScheduleEvent) => {
      const date = event.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });
    
    // Sort dates
    const sortedDates = Object.keys(grouped).sort();
    const result: Record<string, ScheduleEvent[]> = {};
    sortedDates.forEach(date => {
      result[date] = grouped[date].sort((a, b) => a.time.localeCompare(b.time));
    });
    
    return result;
  }, [filteredEvents]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-500">Loading events...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Failed to load events. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by event name, coach, court, type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {searchQuery ? (
                <>Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} matching "{searchQuery}"</>
              ) : (
                <>Showing all {allEvents.length} events</>
              )}
            </div>
            
            {searchQuery && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex justify-center py-8">
            <div className="text-center">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">
                {searchQuery ? "No events match your search." : "No events found."}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                {searchQuery ? "Try adjusting your search terms." : "Events will appear here when they are scheduled."}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(eventsByDate).map(([date, events]) => (
            <Card key={date}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {formatDate(date)}
                  <Badge variant="secondary">{events.length} event{events.length !== 1 ? 's' : ''}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div 
                      key={`${event.id}-${event.time}`}
                      className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getEventColor(event.eventType || 'Practice') }}
                            />
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            {event.eventType && (
                              <Badge 
                                variant="outline" 
                                style={{ 
                                  borderColor: getEventColor(event.eventType),
                                  color: getEventColor(event.eventType)
                                }}
                              >
                                {event.eventType}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(event.time)}
                              {event.duration && ` (${event.duration} min)`}
                            </div>
                            
                            {event.court && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {event.court}
                              </div>
                            )}
                            
                            {event.coach && (
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                Coach: {event.coach}
                              </div>
                            )}
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Action Button */}
                        {user?.role && ["player", "parent"].includes(user.role) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="ml-4"
                            onClick={() => setSelectedEvent(event)}
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Register
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}