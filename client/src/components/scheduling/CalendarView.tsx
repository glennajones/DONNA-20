import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScheduleEvent } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import EventRegistrationModal from "./EventRegistrationModal";

// Event type colors - defined at module level for global access
const getEventColor = (eventType: string) => {
  const colorMap: Record<string, string> = {
    "Practice": "#56A0D3",
    "School Activity": "#10B981", 
    "Tournament": "#FF0000",
    "Camp": "#8B5CF6",
    "Team Camp": "#FFA500",
    "Social": "#EC4899"
  };
  return colorMap[eventType] || "#56A0D3"; // Default to blue if type not found
};

const getEventColorHover = (eventType: string) => {
  const colorMap: Record<string, string> = {
    "Practice": "#4A8BC2",
    "School Activity": "#0F9971",
    "Tournament": "#DC2626",
    "Camp": "#7C3AED",
    "Team Camp": "#EA580C",
    "Social": "#DB2777"
  };
  return colorMap[eventType] || "#4A8BC2";
};

interface CalendarViewProps {
  viewType: "day" | "week" | "month";
}

export default function CalendarView({ viewType }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dateRange, setDateRange] = useState(() => getDateRange(viewType, currentDate));
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
  const [consolidatedEventData, setConsolidatedEventData] = useState<{courts: string[], count: number} | null>(null);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setDateRange(getDateRange(viewType, currentDate));
  }, [viewType, currentDate]);

  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (viewType === "day") {
      newDate.setDate(currentDate.getDate() - 1);
    } else if (viewType === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else if (viewType === "month") {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (viewType === "day") {
      newDate.setDate(currentDate.getDate() + 1);
    } else if (viewType === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else if (viewType === "month") {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: ["/api/schedule", dateRange.from, dateRange.to, "unified", viewType],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
        includeEvents: "true", // Include budget events in the unified view
        viewType: viewType, // Pass view type to backend
      });
      const response = await fetch(`/api/schedule?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch schedule");
      return response.json();
    },
  });

  const events = scheduleData?.events || [];

  // Available courts: 7 indoor + 2 beach
  const courts = [
    "Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6", "Court 7",
    "Beach 1", "Beach 2",
  ];



  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Failed to load schedule data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // Navigation header component
  const navigationHeader = (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigatePrevious}
            className="p-2"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateNext}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateToday}
          >
            Today
          </Button>
        </div>
        <div className="text-lg font-semibold">
          {getDisplayTitle(viewType, currentDate)}
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {navigationHeader}
      {viewType === "day" && renderDayView(events, dateRange, setSelectedEvent)}
      {viewType === "week" && renderWeekView(events, dateRange, setSelectedEvent)}
      {viewType === "month" && renderMonthView(events, dateRange, (event, consolidatedData) => {
        setSelectedEvent(event);
        setConsolidatedEventData(consolidatedData || null);
      })}
      
      {/* Event Details Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={() => {
        setSelectedEvent(null);
        setConsolidatedEventData(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2" style={{ color: getEventColor(selectedEvent.eventType || "Practice") }}>
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getEventColor(selectedEvent.eventType || "Practice") }}
                  ></div>
                  {selectedEvent.title}
                  {selectedEvent.eventType && (
                    <span className="text-xs font-normal px-2 py-1 rounded-full text-white" 
                          style={{ backgroundColor: getEventColor(selectedEvent.eventType) }}>
                      {selectedEvent.eventType}
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Date:</span>
                  <p>{new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600">Time:</span>
                  <p>{selectedEvent.time} - {(() => {
                    const [hours, minutes] = selectedEvent.time.split(':').map(Number);
                    const endMinutes = hours * 60 + minutes + (selectedEvent.duration || 120);
                    const endHours = Math.floor(endMinutes / 60);
                    const endMins = endMinutes % 60;
                    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
                  })()}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600">Court(s):</span>
                  <p>{consolidatedEventData ? consolidatedEventData.courts.join(', ') : selectedEvent.court}</p>
                </div>
                
                <div>
                  <span className="font-medium text-gray-600">Type:</span>
                  <p className="capitalize">{selectedEvent.eventType}</p>
                </div>
                
                {selectedEvent.coach && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Coach:</span>
                    <p>{selectedEvent.coach}</p>
                  </div>
                )}
                
                {selectedEvent.description && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-600">Description:</span>
                    <p>{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              {/* Registration Button for Players/Parents */}
              {selectedEvent && ["player", "parent"].includes(user?.role) && (
                <div className="mt-6 pt-4 border-t">
                  <Button 
                    onClick={() => {
                      setRegistrationModalOpen(true);
                    }}
                    className="w-full bg-[#56A0D3] hover:bg-[#4a8bc2] flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register for This Session
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Registration Modal */}
      <EventRegistrationModal
        isOpen={registrationModalOpen}
        onClose={() => setRegistrationModalOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}

// Helper functions
function generateTimeSlots(): string[] {
  const slots = [];
  for (let hour = 7; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 20 && minute > 30) break; // Stop at 8:30 PM
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(timeString);
    }
  }
  return slots;
}

function formatTime(timeSlot: string): string {
  const [hours, minutes] = timeSlot.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function abbreviateCourts(courtString: string): string {
  return courtString
    .split(',')
    .map(court => court.trim())
    .map(court => {
      if (court.startsWith('Court ')) {
        return 'C' + court.replace('Court ', '');
      } else if (court.startsWith('Beach ')) {
        return 'B' + court.replace('Beach ', '');
      }
      return court;
    })
    .join(', ');
}

function findEventInTimeSlot(events: ScheduleEvent[], court: string, timeSlot: string): ScheduleEvent | undefined {
  return events.find((event) => {
    // Handle multi-court events (comma-separated court names)
    const eventCourts = event.court.split(',').map(c => c.trim());
    if (!eventCourts.includes(court)) return false;
    
    const [slotHours, slotMinutes] = timeSlot.split(":").map(Number);
    const slotTotalMinutes = slotHours * 60 + slotMinutes;
    
    const [eventHours, eventMinutes] = event.time.split(":").map(Number);
    const eventStartMinutes = eventHours * 60 + eventMinutes;
    const eventEndMinutes = eventStartMinutes + (event.duration || 120);
    
    // Check if the time slot falls within the event duration
    return slotTotalMinutes >= eventStartMinutes && slotTotalMinutes < eventEndMinutes;
  });
}

function findFirstSlotForEvent(events: ScheduleEvent[], court: string, timeSlots: string[]): string | null {
  // Find any event in this court (or 'any' for week view)
  const event = court === 'any' ? events[0] : events.find(e => {
    const eventCourts = e.court.split(',').map(c => c.trim());
    return eventCourts.includes(court);
  });
  
  if (!event) return null;
  
  // Find the first time slot that contains this event
  const [eventHours, eventMinutes] = event.time.split(":").map(Number);
  const eventStartMinutes = eventHours * 60 + eventMinutes;
  
  for (const slot of timeSlots) {
    const [slotHours, slotMinutes] = slot.split(":").map(Number);
    const slotMinutesTotal = slotHours * 60 + slotMinutes;
    
    if (slotMinutesTotal >= eventStartMinutes) {
      return slot;
    }
  }
  
  return null;
}

function getWeekDays(startDate: string) {
  // Parse date string safely to avoid timezone issues
  const [year, month, day] = startDate.split('-').map(Number);
  const inputDate = new Date(year, month - 1, day);
  const days = [];
  
  // Find the Sunday of this week
  const sunday = new Date(inputDate);
  const dayOfWeek = inputDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  sunday.setDate(inputDate.getDate() - dayOfWeek);
  
  // Generate 7 days starting from Sunday
  for (let i = 0; i < 7; i++) {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    days.push({
      date: date.toISOString().split('T')[0],
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate()
    });
  }
  
  return days;
}

function getMonthDays(dateString: string) {
  // Parse date string safely to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day); // month is 0-indexed
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  
  // First day of the month
  const firstDay = new Date(targetYear, targetMonth, 1);
  // Last day of the month
  const lastDay = new Date(targetYear, targetMonth + 1, 0);
  
  // Start from the first Sunday of the calendar grid
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  
  // End at the last Saturday of the calendar grid
  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));
  
  const days = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    days.push({
      date: currentDate.toISOString().split('T')[0],
      dayNumber: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === targetMonth
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return days;
}

function formatDateDisplay(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatMonthYear(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { 
    month: 'long', 
    year: 'numeric' 
  });
}

function renderDayView(events: ScheduleEvent[], dateRange: { from: string; to: string }, setSelectedEvent: (event: ScheduleEvent) => void) {
  const timeSlots = generateTimeSlots();
  const courts = [
    "Court 1", "Court 2", "Court 3", "Court 4", "Court 5", "Court 6", "Court 7",
    "Beach 1", "Beach 2",
  ];

  const todayEvents = events
    .filter((e: ScheduleEvent) => e.date === dateRange.from)
    .sort((a, b) => {
      const [aHours, aMinutes] = a.time.split(':').map(Number);
      const [bHours, bMinutes] = b.time.split(':').map(Number);
      const aTimeMinutes = aHours * 60 + aMinutes;
      const bTimeMinutes = bHours * 60 + bMinutes;
      return aTimeMinutes - bTimeMinutes;
    });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            📅 Day View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header row with courts */}
              <div className="grid gap-px bg-gray-200 rounded-t-lg overflow-hidden" style={{gridTemplateColumns: `80px repeat(${courts.length}, 1fr)`}}>
                <div className="bg-gray-100 p-3 font-medium text-center text-sm">Time</div>
                {courts.map((court) => (
                  <div key={court} className="bg-gray-100 p-3 font-medium text-center text-xs">
                    {court}
                  </div>
                ))}
              </div>

              {/* Time slots grid */}
              <div className="grid gap-px bg-gray-200" style={{gridTemplateColumns: `80px repeat(${courts.length}, 1fr)`}}>
{timeSlots.map((timeSlot, timeIndex) => (
                  <div key={timeSlot} className="contents">
                    <div className="bg-gray-50 p-2 text-xs font-medium text-gray-600 flex items-center justify-center border-r">
                      {formatTime(timeSlot)}
                    </div>
                    {courts.map((court) => {
                      const eventInSlot = findEventInTimeSlot(todayEvents, court, timeSlot);
                      const firstEventSlot = findFirstSlotForEvent(todayEvents, court, timeSlots);
                      const isFirstSlot = timeSlot === firstEventSlot;
                      
                      return (
                        <div
                          key={`${court}-${timeSlot}`}
                          className={`bg-white p-1 h-[40px] relative ${
                            eventInSlot ? "bg-[#56A0D3]/10 border-l-2 border-[#56A0D3]" : "hover:bg-gray-50"
                          }`}
                          style={{ overflow: isFirstSlot ? 'visible' : 'hidden' }}
                        >
                          {eventInSlot && isFirstSlot && (
                            <div 
                              className="text-xs text-white p-2 rounded cursor-pointer transition-colors absolute left-1 right-1 flex flex-col justify-start z-10"
                              onClick={() => setSelectedEvent(eventInSlot)}
                              title={`${eventInSlot.title} - ${eventInSlot.coach}`}
                              style={{
                                backgroundColor: getEventColor(eventInSlot.eventType || "Practice"),
                                top: '4px',
                                height: `${(eventInSlot.duration || 120) / 30 * 40 - 8}px`
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = getEventColorHover(eventInSlot.eventType || "Practice");
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = getEventColor(eventInSlot.eventType || "Practice");
                              }}
                            >
                              <div className="font-medium truncate">
                                {eventInSlot.title}
                              </div>
                              <div className="text-xs opacity-90">
                                {eventInSlot.coach}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function renderWeekView(events: ScheduleEvent[], dateRange: { from: string; to: string }, setSelectedEvent: (event: ScheduleEvent) => void) {
  const weekDays = getWeekDays(dateRange.from);
  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            📅 Week View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header row with days */}
              <div className="grid grid-cols-8 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
                <div className="bg-gray-100 p-3 font-medium text-center text-sm">Time</div>
                {weekDays.map((day) => (
                  <div key={day.date} className="bg-gray-100 p-3 font-medium text-center text-xs">
                    <div>{day.name}</div>
                    <div className="text-xs text-[#56A0D3]">{day.date.split('-')[2]}</div>
                  </div>
                ))}
              </div>

              {/* Time slots grid */}
              <div className="grid grid-cols-8 gap-px bg-gray-200">
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot} className="contents">
                    <div className="bg-gray-50 p-2 text-xs font-medium text-gray-600 flex items-center justify-center border-r">
                      {formatTime(timeSlot)}
                    </div>
                    {weekDays.map((day) => {
                      const dayEvents = events
                        .filter(e => e.date === day.date)
                        .sort((a, b) => {
                          const [aHours, aMinutes] = a.time.split(':').map(Number);
                          const [bHours, bMinutes] = b.time.split(':').map(Number);
                          const aTimeMinutes = aHours * 60 + aMinutes;
                          const bTimeMinutes = bHours * 60 + bMinutes;
                          return aTimeMinutes - bTimeMinutes;
                        });
                      const eventsInSlot = dayEvents.filter(event => {
                        const [eventHours, eventMinutes] = event.time.split(":").map(Number);
                        const eventStartMinutes = eventHours * 60 + eventMinutes;
                        const eventEndMinutes = eventStartMinutes + (event.duration || 120);
                        
                        const [slotHours, slotMinutes] = timeSlot.split(":").map(Number);
                        const slotTotalMinutes = slotHours * 60 + slotMinutes;
                        
                        return slotTotalMinutes >= eventStartMinutes && slotTotalMinutes < eventEndMinutes;
                      });

                      // Find events that start in this time slot
                      const eventsStartingInSlot = eventsInSlot.filter(event => {
                        const firstEventSlot = findFirstSlotForEvent([event], 'any', timeSlots);
                        return timeSlot === firstEventSlot;
                      });

                      return (
                        <div
                          key={`${day.date}-${timeSlot}`}
                          className={`bg-white p-1 h-[40px] relative ${
                            eventsInSlot.length > 0 ? "bg-[#56A0D3]/10 border-l-2 border-[#56A0D3]" : "hover:bg-gray-50"
                          }`}
                          style={{ overflow: eventsStartingInSlot.length > 0 ? 'visible' : 'hidden' }}
                        >
                          {eventsStartingInSlot.map((event, index) => (
                            <div 
                              key={event.id} 
                              className="text-xs text-white p-2 rounded cursor-pointer transition-colors absolute left-1 right-1 flex flex-col justify-start z-10"
                              onClick={() => setSelectedEvent(event)}
                              title={`${event.title} - ${event.coach}`}
                              style={{
                                backgroundColor: getEventColor(event.eventType || "Practice"),
                                top: '4px',
                                height: `${(event.duration || 120) / 30 * 40 - 8}px`
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = getEventColorHover(event.eventType || "Practice");
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = getEventColor(event.eventType || "Practice");
                              }}
                            >
                              <div className="font-medium truncate">
                                {event.title}
                              </div>
                              <div className="text-xs opacity-90">{abbreviateCourts(event.court)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function renderMonthView(events: ScheduleEvent[], dateRange: { from: string; to: string }, setSelectedEvent: (event: ScheduleEvent, consolidatedData?: {courts: string[], count: number}) => void) {
  const monthDays = getMonthDays(dateRange.from);
  const today = new Date().toISOString().split('T')[0];
  


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            📅 Month View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-[#56A0D3] bg-[#56A0D3]/10 text-sm border border-[#56A0D3]/20">
                {day}
              </div>
            ))}
            
            {/* Calendar days */}
            {monthDays.map((day, index) => {
              const dayEvents = events.filter(e => e.date === day.date);
              const isToday = day.date === today;
              const isCurrentMonth = day.isCurrentMonth;
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-200 ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isToday ? 'bg-[#56A0D3]/10 border-[#56A0D3]' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-[#56A0D3] font-bold' : ''}`}>
                    {day.dayNumber}
                  </div>
                  
                  <div className="space-y-1">
                    {(() => {
                      // Group events by title and time to consolidate similar events
                      const groupedEvents = dayEvents
                        .sort((a, b) => {
                          const [aHours, aMinutes] = a.time.split(':').map(Number);
                          const [bHours, bMinutes] = b.time.split(':').map(Number);
                          const aTimeMinutes = aHours * 60 + aMinutes;
                          const bTimeMinutes = bHours * 60 + bMinutes;
                          return aTimeMinutes - bTimeMinutes;
                        })
                        .reduce((groups, event) => {
                          const key = `${event.time}-${event.title}`;
                          if (!groups[key]) {
                            groups[key] = {
                              event: event,
                              count: 1,
                              courts: [event.court]
                            };
                          } else {
                            groups[key].count++;
                            if (!groups[key].courts.includes(event.court)) {
                              groups[key].courts.push(event.court);
                            }
                          }
                          return groups;
                        }, {} as Record<string, { event: ScheduleEvent; count: number; courts: string[] }>);

                      const consolidatedEvents = Object.values(groupedEvents).slice(0, 3);
                      
                      return consolidatedEvents.map((group, index) => (
                        <div
                          key={`${group.event.id}-${index}`}
                          className="text-xs p-1 rounded text-white truncate cursor-pointer transition-colors"
                          title={`${group.event.time} - ${group.event.title}${group.count > 1 ? ` (${group.count}x)` : ''} - ${group.courts.join(', ')}`}
                          onClick={() => setSelectedEvent(group.event, {courts: group.courts, count: group.count})}
                          style={{
                            backgroundColor: getEventColor(group.event.eventType || "Practice")
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = getEventColorHover(group.event.eventType || "Practice");
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = getEventColor(group.event.eventType || "Practice");
                          }}
                        >
                          {formatTime(group.event.time)} {group.event.title}{group.count > 1 ? ` (${group.count})` : ''}
                        </div>
                      ));
                    })()}
                    {(() => {
                      // Calculate remaining events after consolidation
                      const groupedEvents = dayEvents
                        .reduce((groups, event) => {
                          const key = `${event.time}-${event.title}`;
                          if (!groups[key]) {
                            groups[key] = { event: event, count: 1 };
                          } else {
                            groups[key].count++;
                          }
                          return groups;
                        }, {} as Record<string, { event: ScheduleEvent; count: number }>);
                      
                      const totalGroups = Object.keys(groupedEvents).length;
                      if (totalGroups > 3) {
                        return (
                          <div 
                            className="text-xs text-gray-500 cursor-pointer hover:text-gray-700"
                            onClick={() => {
                              const sortedEvents = dayEvents.sort((a, b) => {
                                const [aHours, aMinutes] = a.time.split(':').map(Number);
                                const [bHours, bMinutes] = b.time.split(':').map(Number);
                                const aTimeMinutes = aHours * 60 + aMinutes;
                                const bTimeMinutes = bHours * 60 + bMinutes;
                                return aTimeMinutes - bTimeMinutes;
                              });
                              setSelectedEvent(sortedEvents[0]);
                            }}
                          >
                            +{totalGroups - 3} more
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getDateRange(viewType: "day" | "week" | "month", currentDate: Date) {
  let from = new Date(currentDate);
  let to = new Date(currentDate);

  if (viewType === "week") {
    // Ensure week starts on Sunday (0)
    const dayOfWeek = currentDate.getDay();
    from.setDate(currentDate.getDate() - dayOfWeek);
    to.setDate(from.getDate() + 6);
  } else if (viewType === "month") {
    from = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    to = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  }
  // For "day", from and to are the same (currentDate)

  return {
    from: from.toISOString().split("T")[0], // YYYY-MM-DD format
    to: to.toISOString().split("T")[0],
  };
}

function getDisplayTitle(viewType: "day" | "week" | "month", currentDate: Date): string {
  if (viewType === "day") {
    return currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } else if (viewType === "week") {
    // Ensure week starts on Sunday
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    return currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }
}