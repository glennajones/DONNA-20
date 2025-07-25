import { useState } from "react";
import { useLocation } from "wouter";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { DashboardNav } from "@/components/ui/dashboard-nav";
import UnifiedSchedulingView from "@/components/scheduling/UnifiedSchedulingView";
import CourtManager from "@/components/scheduling/CourtManager";
import SearchEventsTab from "@/components/scheduling/SearchEventsTab";
import { useAuth } from "@/lib/auth";
import { ScheduleEvent } from "@shared/schema";
import { Monitor, ExternalLink, Search } from "lucide-react";

export default function TrainingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("calendar");
  const [targetDate, setTargetDate] = useState<string | null>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const handleEventClick = (event: ScheduleEvent) => {
    // Switch to calendar tab and set the target date
    setActiveTab("calendar");
    setTargetDate(event.date);
    
    // Clear the target date after calendar has had time to navigate
    // This prevents the calendar from jumping back on mouse movement
    setTimeout(() => {
      setTargetDate(null);
    }, 2000);
  };

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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${user?.role && ["admin", "manager", "coach"].includes(user.role) ? "grid-cols-3" : "grid-cols-2"}`}>
                <TabsTrigger value="calendar">📅 Unified Scheduling</TabsTrigger>
                <TabsTrigger value="search">🔍 Search Events</TabsTrigger>
                {user?.role && ["admin", "manager", "coach"].includes(user.role) && (
                  <TabsTrigger value="courts">🏟️ Court Manager</TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="calendar" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Switch between Day, Week, Month, and Grid views using the controls in the calendar below.
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

                {/* Unified Scheduling Component */}
                <UnifiedSchedulingView 
                  searchQuery={searchQuery}
                  targetDate={targetDate}
                />
              </TabsContent>

              <TabsContent value="search" className="space-y-4">
                <SearchEventsTab onEventClick={handleEventClick} />
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