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

  // Generate time slots from 7:00 AM to 8:30 PM every 30 minutes
  const timeSlots = generateTimeSlots();

  // Filter events for today (or selected date range)
  const todayEvents = events.filter((e: ScheduleEvent) => {
    if (viewType === "day") {
      return e.date === new Date().toISOString().split("T")[0];
    }
    return true; // For week/month view, show all events in range
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            📅 {viewType.charAt(0).toUpperCase() + viewType.slice(1)} View
            <span className="ml-2 text-sm font-normal text-gray-500">
              {dateRange.from} to {dateRange.to}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Schedule Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header row with courts */}
              <div className="grid grid-cols-10 gap-px bg-gray-200 rounded-t-lg overflow-hidden">
                <div className="bg-gray-100 p-3 font-medium text-center text-sm">
                  Time
                </div>
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
                    {/* Time column */}
                    <div className="bg-gray-50 p-2 text-xs font-medium text-gray-600 flex items-center justify-center border-r">
                      {formatTime(timeSlot)}
                    </div>
                    
                    {/* Court columns */}
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

          {/* Google Calendar Integration note */}
          <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              📌 <strong>Google Calendar Integration</strong>
            </p>
            <p className="text-xs text-gray-500">
              The grid above shows your club's schedule. To sync with Google Calendar, you can export this data or integrate with Google Calendar API.
            </p>
          </div>

          {events.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No events scheduled for this time period. Use the Court Manager tab to add new training sessions.
              </AlertDescription>
            </Alert>
          )}
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