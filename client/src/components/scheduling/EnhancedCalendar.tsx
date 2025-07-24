import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ScheduleEvent } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { Calendar, Filter, Info } from "lucide-react";

// Event type configuration with colors
const EVENT_TYPES = [
  { value: "all", label: "All Events", color: "#64748b" },
  { value: "training", label: "Training", color: "#34d399" },
  { value: "match", label: "Match", color: "#60a5fa" },
  { value: "tournament", label: "Tournament", color: "#f59e0b" },
  { value: "practice", label: "Practice", color: "#8b5cf6" },
  { value: "tryout", label: "Tryouts", color: "#ef4444" },
  { value: "camp", label: "Camp", color: "#06b6d4" },
  { value: "social", label: "Social", color: "#ec4899" }
];

const getEventTypeColor = (eventType: string) => {
  const type = EVENT_TYPES.find(t => t.value === eventType);
  return type?.color || "#64748b";
};

interface EnhancedCalendarProps {
  initialView?: "dayGridMonth" | "timeGridWeek" | "timeGridDay";
}

export default function EnhancedCalendar({ initialView = "timeGridWeek" }: EnhancedCalendarProps) {
  const [filterType, setFilterType] = useState("all");
  const [isDragging, setIsDragging] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schedule events
  const { data: response, isLoading, error } = useQuery<{events: ScheduleEvent[]}>({
    queryKey: ["/api/schedule"],
    enabled: true,
  });

  const events = response?.events || [];

  // Reschedule mutation for drag-and-drop
  const rescheduleEvent = useMutation({
    mutationFn: async ({ eventId, start_time, end_time }: { 
      eventId: string; 
      start_time: string; 
      end_time: string; 
    }) => {
      // Extract numeric ID from event ID (remove schedule- or event- prefix)
      const numericId = eventId.replace(/^(schedule-|event-)/, '');
      
      return apiRequest(`/api/schedule/${numericId}/reschedule`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ start_time, end_time })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      toast({
        title: "Event Rescheduled",
        description: "The event has been successfully moved to the new time slot.",
      });
      setIsDragging(false);
    },
    onError: (error: any) => {
      console.error("Reschedule error:", error);
      setIsDragging(false);
      
      // Handle conflict errors specifically
      if (error.error === "conflict") {
        toast({
          title: "Scheduling Conflict",
          description: "This time slot conflicts with another event on the same court.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Reschedule Failed", 
          description: error.message || "Failed to reschedule the event. Please try again.",
          variant: "destructive",
        });
      }
      
      // Refresh calendar to revert visual changes
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
    }
  });

  // Filter events by type
  const filteredEvents = events
    .filter((event: ScheduleEvent) => 
      filterType === "all" || event.eventType === filterType
    )
    .map((event: ScheduleEvent) => {
      // Create proper start and end datetime strings
      const startDateTime = `${event.date}T${event.time}:00`;
      const startDate = new Date(startDateTime);
      const endDate = new Date(startDate.getTime() + (event.duration * 60 * 1000));

      return {
        id: event.id.toString(),
        title: `${event.title}${event.court ? ` - ${event.court}` : ''}`,
        start: startDateTime,
        end: endDate.toISOString(),
        backgroundColor: getEventTypeColor(event.eventType),
        borderColor: getEventTypeColor(event.eventType),
        textColor: "#ffffff",
        extendedProps: {
          court: event.court,
          coach: event.coach,
          eventType: event.eventType,
          participants: event.participants,
          description: event.description,
          originalEvent: event
        }
      };
    });

  // Handle event drop (drag-and-drop reschedule)
  const handleEventDrop = (info: any) => {
    // Only allow admins, managers, and coaches to reschedule
    if (!["admin", "manager", "coach"].includes(user?.role || "")) {
      info.revert();
      toast({
        title: "Access Denied",
        description: "You don't have permission to reschedule events.",
        variant: "destructive",
      });
      return;
    }

    const eventId = info.event.id;
    const start_time = info.event.start.toISOString();
    const end_time = info.event.end ? info.event.end.toISOString() : 
                     new Date(info.event.start.getTime() + 2 * 60 * 60 * 1000).toISOString(); // Default 2 hours

    setIsDragging(true);
    rescheduleEvent.mutate({ eventId, start_time, end_time });
  };

  // Handle event resize
  const handleEventResize = (info: any) => {
    // Only allow admins, managers, and coaches to resize
    if (!["admin", "manager", "coach"].includes(user?.role || "")) {
      info.revert();
      toast({
        title: "Access Denied", 
        description: "You don't have permission to resize events.",
        variant: "destructive",
      });
      return;
    }

    const eventId = info.event.id;
    const start_time = info.event.start.toISOString();
    const end_time = info.event.end.toISOString();

    setIsDragging(true);
    rescheduleEvent.mutate({ eventId, start_time, end_time });
  };

  // Event click handler for details
  const handleEventClick = (info: any) => {
    const event = info.event.extendedProps.originalEvent;
    
    toast({
      title: event.title,
      description: `${event.court} | ${event.time} | Coach: ${event.coach || 'TBD'}`,
    });
  };

  if (error) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Failed to load calendar events. Please refresh the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <CardTitle>Enhanced Training Calendar</CardTitle>
          </div>
          
          {/* Event Type Filter */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: type.color }}
                        />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Event count badge */}
            <Badge variant="secondary">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        
        {/* Permissions info */}
        {["admin", "manager", "coach"].includes(user?.role || "") && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            💡 Drag events to reschedule, resize to change duration
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Loading calendar...</p>
            </div>
          </div>
        ) : (
          <div className="h-[600px]">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={initialView}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay"
              }}
              events={filteredEvents}
              editable={["admin", "manager", "coach"].includes(user?.role || "")}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventClick={handleEventClick}
              height="auto"
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              nowIndicator={true}
              weekends={true}
              selectMirror={true}
              dayMaxEvents={true}
              eventDisplay="block"
              eventTextColor="#ffffff"
              eventStartEditable={["admin", "manager", "coach"].includes(user?.role || "")}
              eventDurationEditable={["admin", "manager", "coach"].includes(user?.role || "")}
              eventConstraint={{
                start: "06:00",
                end: "22:00"
              }}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // Monday through Sunday
                startTime: "08:00",
                endTime: "20:00"
              }}
              loading={(isLoading) => setIsDragging(isLoading)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}