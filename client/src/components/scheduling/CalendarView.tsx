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
          {/* Embedded Google Calendar placeholder */}
          <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              📌 <strong>Google Calendar Integration</strong>
            </p>
            <p className="text-xs text-gray-500">
              To display your Google Calendar here, you'll need to:
              <br />
              1. Create a Google Calendar for your volleyball club
              <br />
              2. Get the embed code from Google Calendar settings
              <br />
              3. Replace the placeholder with your calendar's embed URL
            </p>
          </div>

          {/* Events by Court */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-3 py-2 text-left font-medium">Court</th>
                  <th className="border px-3 py-2 text-left font-medium">Scheduled Events</th>
                </tr>
              </thead>
              <tbody>
                {courts.map((court) => {
                  const courtEvents = events.filter((e: ScheduleEvent) => e.court === court);
                  return (
                    <tr key={court} className="hover:bg-gray-50">
                      <td className="border px-3 py-2 font-medium text-gray-900">
                        {court}
                      </td>
                      <td className="border px-3 py-2">
                        {courtEvents.length > 0 ? (
                          <div className="space-y-2">
                            {courtEvents.map((event: ScheduleEvent) => (
                              <div
                                key={event.id}
                                className="p-2 bg-blue-50 border-l-4 border-blue-400 rounded"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-blue-900">
                                    {event.title}
                                  </span>
                                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                    {event.eventType}
                                  </span>
                                </div>
                                <div className="text-sm text-blue-700 mt-1">
                                  📅 {event.date} at {event.time}
                                  {event.duration && ` (${event.duration} min)`}
                                </div>
                                {event.coach && (
                                  <div className="text-sm text-blue-600 mt-1">
                                    👨‍🏫 Coach: {event.coach}
                                  </div>
                                )}
                                {event.participants && event.participants.length > 0 && (
                                  <div className="text-sm text-blue-600 mt-1">
                                    👥 Participants: {event.participants.join(", ")}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">No events scheduled</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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