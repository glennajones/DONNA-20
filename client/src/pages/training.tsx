import { useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DashboardNav } from "@/components/ui/dashboard-nav";
import CalendarView from "@/components/scheduling/CalendarView";
import EnhancedCalendar from "@/components/scheduling/EnhancedCalendar";
import CourtManager from "@/components/scheduling/CourtManager";
import { useAuth } from "@/lib/auth";
import { Monitor, ExternalLink, Calendar, Filter } from "lucide-react";

export default function TrainingPage() {
  const [viewType, setViewType] = useState<"day" | "week" | "month">("week");
  const [calendarMode, setCalendarMode] = useState<"classic" | "enhanced">("enhanced");
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <ProtectedRoute requiredRoles={["admin", "manager", "coach", "player", "parent"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar />
        
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <DashboardNav title="Training & Scheduling" />
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Training & Scheduling</h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View training sessions, browse the schedule calendar, and register for events.
            </p>
          </div>

          <div className="px-4 sm:px-0">
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className={`grid w-full ${user?.role && ["admin", "manager", "coach"].includes(user.role) ? "grid-cols-2" : "grid-cols-1"}`}>
                <TabsTrigger value="calendar">📅 Schedule Calendar</TabsTrigger>
                {user?.role && ["admin", "manager", "coach"].includes(user.role) && (
                  <TabsTrigger value="courts">🏟️ Court Manager</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="calendar" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-6">
                    {/* Calendar Mode Toggle */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Mode:</span>
                      <div className="flex bg-white dark:bg-gray-800 border rounded-lg">
                        <button
                          onClick={() => setCalendarMode("enhanced")}
                          className={`px-3 py-1 text-sm flex items-center gap-1 ${
                            calendarMode === "enhanced"
                              ? "bg-blue-500 text-white"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                          } rounded-l-lg`}
                        >
                          <Filter className="h-3 w-3" />
                          Enhanced
                        </button>
                        <button
                          onClick={() => setCalendarMode("classic")}
                          className={`px-3 py-1 text-sm flex items-center gap-1 ${
                            calendarMode === "classic"
                              ? "bg-blue-500 text-white"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                          } rounded-r-lg`}
                        >
                          <Calendar className="h-3 w-3" />
                          Classic
                        </button>
                      </div>
                    </div>

                    {/* Classic view controls */}
                    {calendarMode === "classic" && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">View:</span>
                        <div className="flex bg-white dark:bg-gray-800 border rounded-lg">
                          {(["day", "week", "month"] as const).map((type) => (
                            <button
                              key={type}
                              onClick={() => setViewType(type)}
                              className={`px-3 py-1 text-sm capitalize ${
                                viewType === type
                                  ? "bg-blue-500 text-white"
                                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                              } first:rounded-l-lg last:rounded-r-lg`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* TV Display Button */}
                  <Button
                    onClick={() => setLocation('/tv-display')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Monitor className="h-4 w-4" />
                    TV Display
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                {/* Calendar Component */}
                {calendarMode === "enhanced" ? (
                  <EnhancedCalendar initialView="timeGridWeek" />
                ) : (
                  <CalendarView viewType={viewType} />
                )}
              </TabsContent>
              
              {user?.role && ["admin", "manager", "coach"].includes(user.role) && (
                <TabsContent value="courts">
                  <CourtManager />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}