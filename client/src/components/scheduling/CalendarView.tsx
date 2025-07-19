import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScheduleEvent } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CalendarViewProps {
  viewType: "day" | "week" | "month";
}

export default function CalendarView({ viewType }: CalendarViewProps) {
  const [dateRange, setDateRange] = useState(() => getDateRange(viewType));

  useEffect(() => {
    setDateRange(getDateRange(viewType));
  }, [viewType]);

  const { data: scheduleData, isLoading, error } = useQuery({
    queryKey: ["/api/schedule", dateRange.from, dateRange.to],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
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
    ...Array.from({ length: 7 }, (_, i) => `Indoor Court ${i + 1}`),
    "Beach Court 1",
    "Beach Court 2",
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

  if (viewType === "day") {
    return renderDayView(events, dateRange);
  } else if (viewType === "week") {
    return renderWeekView(events, dateRange);
  } else {
    return renderMonthView(events, dateRange);
  }
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

function findEventInTimeSlot(events: ScheduleEvent[], court: string, timeSlot: string): ScheduleEvent | undefined {
  return events.find((event) => {
    if (event.court !== court) return false;
    
    const [slotHours, slotMinutes] = timeSlot.split(":").map(Number);
    const slotTotalMinutes = slotHours * 60 + slotMinutes;
    
    const [eventHours, eventMinutes] = event.time.split(":").map(Number);
    const eventStartMinutes = eventHours * 60 + eventMinutes;
    const eventEndMinutes = eventStartMinutes + (event.duration || 120);
    
    // Check if the time slot falls within the event duration
    return slotTotalMinutes >= eventStartMinutes && slotTotalMinutes < eventEndMinutes;
  });
}

function getWeekDays(startDate: string) {
  const start = new Date(startDate);
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push({
      date: date.toISOString().split('T')[0],
      name: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate()
    });
  }
  
  return days;
}

function getMonthDays(dateString: string) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0);
  
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
      isCurrentMonth: currentDate.getMonth() === month
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

function renderDayView(events: ScheduleEvent[], dateRange: { from: string; to: string }) {
  const timeSlots = generateTimeSlots();
  const courts = [
    ...Array.from({ length: 7 }, (_, i) => `Indoor Court ${i + 1}`),
    "Beach Court 1",
    "Beach Court 2",
  ];

  const todayEvents = events.filter((e: ScheduleEvent) => e.date === dateRange.from);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            📅 Day View - {formatDateDisplay(dateRange.from)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header row with courts */}
              <div className="grid grid-cols-10 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
                <div className="bg-gray-100 p-3 font-medium text-center text-sm">Time</div>
                {courts.map((court) => (
                  <div key={court} className="bg-gray-100 p-3 font-medium text-center text-xs">
                    {court.replace("Court ", "")}
                  </div>
                ))}
              </div>

              {/* Time slots grid */}
              <div className="grid grid-cols-10 gap-px bg-gray-200">
                {timeSlots.map((timeSlot) => (
                  <div key={timeSlot} className="contents">
                    <div className="bg-gray-50 p-2 text-xs font-medium text-gray-600 flex items-center justify-center border-r">
                      {formatTime(timeSlot)}
                    </div>
                    {courts.map((court) => {
                      const eventInSlot = findEventInTimeSlot(todayEvents, court, timeSlot);
                      return (
                        <div
                          key={`${court}-${timeSlot}`}
                          className={`bg-white p-1 min-h-[40px] relative ${
                            eventInSlot ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          {eventInSlot && (
                            <div className="text-xs">
                              <div className="font-medium text-blue-900 truncate">
                                {eventInSlot.title}
                              </div>
                              <div className="text-blue-600 truncate">
                                {eventInSlot.coach}
                              </div>
                              <div className="text-xs text-blue-500">
                                {eventInSlot.eventType}
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

function renderWeekView(events: ScheduleEvent[], dateRange: { from: string; to: string }) {
  const weekDays = getWeekDays(dateRange.from);
  const timeSlots = generateTimeSlots();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            📅 Week View - {formatDateDisplay(dateRange.from)} to {formatDateDisplay(dateRange.to)}
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
                    <div className="text-xs text-gray-600">{day.date.split('-')[2]}</div>
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
                      const dayEvents = events.filter(e => e.date === day.date);
                      const eventsInSlot = dayEvents.filter(event => {
                        const [eventHours, eventMinutes] = event.time.split(":").map(Number);
                        const eventStartMinutes = eventHours * 60 + eventMinutes;
                        const eventEndMinutes = eventStartMinutes + (event.duration || 120);
                        
                        const [slotHours, slotMinutes] = timeSlot.split(":").map(Number);
                        const slotTotalMinutes = slotHours * 60 + slotMinutes;
                        
                        return slotTotalMinutes >= eventStartMinutes && slotTotalMinutes < eventEndMinutes;
                      });

                      return (
                        <div
                          key={`${day.date}-${timeSlot}`}
                          className={`bg-white p-1 min-h-[40px] relative ${
                            eventsInSlot.length > 0 ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          {eventsInSlot.map((event, index) => (
                            <div key={event.id} className="text-xs mb-1">
                              <div className="font-medium text-blue-900 truncate">
                                {event.court.replace("Court ", "")} - {event.title}
                              </div>
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

function renderMonthView(events: ScheduleEvent[], dateRange: { from: string; to: string }) {
  const monthDays = getMonthDays(dateRange.from);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            📅 Month View - {formatMonthYear(dateRange.from)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center font-medium text-gray-600 bg-gray-100 text-sm">
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
                  } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-700' : ''}`}>
                    {day.dayNumber}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate"
                        title={`${event.time} - ${event.title} (${event.court})`}
                      >
                        {event.time} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
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

function getDateRange(viewType: "day" | "week" | "month") {
  const now = new Date();
  let from = new Date(now);
  let to = new Date(now);

  if (viewType === "week") {
    from.setDate(now.getDate() - now.getDay());
    to.setDate(from.getDate() + 6);
  } else if (viewType === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
    to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  // For "day", from and to are the same (today)

  return {
    from: from.toISOString().split("T")[0], // YYYY-MM-DD format
    to: to.toISOString().split("T")[0],
  };
}