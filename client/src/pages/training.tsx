import { useState } from "react";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CalendarView from "@/components/scheduling/CalendarView";
import CourtManager from "@/components/scheduling/CourtManager";

export default function TrainingPage() {
  const [viewType, setViewType] = useState<"day" | "week" | "month">("week");

  return (
    <ProtectedRoute requiredRoles={["admin", "manager", "coach"]}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <h1 className="text-3xl font-bold text-gray-900">Training & Scheduling</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage training sessions, court bookings, and view the schedule calendar.
            </p>
          </div>

          <div className="px-4 sm:px-0">
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendar">📅 Schedule Calendar</TabsTrigger>
                <TabsTrigger value="courts">🏟️ Court Manager</TabsTrigger>
              </TabsList>
              
              <TabsContent value="calendar" className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-sm font-medium">View:</span>
                  <div className="flex bg-white border rounded-lg">
                    {(["day", "week", "month"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setViewType(type)}
                        className={`px-3 py-1 text-sm capitalize ${
                          viewType === type
                            ? "bg-blue-500 text-white"
                            : "text-gray-600 hover:bg-gray-50"
                        } first:rounded-l-lg last:rounded-r-lg`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <CalendarView viewType={viewType} />
              </TabsContent>
              
              <TabsContent value="courts">
                <CourtManager />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}