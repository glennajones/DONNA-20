import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventWizardAccordion } from "@/components/events/EventWizardAccordion";
import { EventList } from "@/components/events/EventList";
import { DashboardNav } from "@/components/ui/dashboard-nav";
import { useAuth } from "@/lib/auth";

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState("events");
  const { user } = useAuth();

  const canCreateEvents = user?.role === "admin" || user?.role === "manager";

  const handleEventCreated = () => {
    setActiveTab("events");
  };

  return (
    <div className="container mx-auto p-6">
      <DashboardNav title="Events & Budgeting" />
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Events & Budgeting
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Plan volleyball events, estimate costs, and track financial performance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="events">Events</TabsTrigger>
          {canCreateEvents && <TabsTrigger value="wizard">Create Event</TabsTrigger>}
        </TabsList>

        <TabsContent value="events" className="mt-6">
          <EventList />
        </TabsContent>

        {canCreateEvents && (
          <TabsContent value="wizard" className="mt-6">
            <EventWizardAccordion onComplete={handleEventCreated} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}