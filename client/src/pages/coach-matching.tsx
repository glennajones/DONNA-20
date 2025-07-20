import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CoachManagement from "@/modules/Admin/CoachManagement";
import PendingOffers from "@/modules/Admin/PendingOffers";

export default function CoachMatchingPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  // Only allow admin and manager access
  if (!["admin", "manager"].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You need administrator or manager privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6">
        <Tabs defaultValue="coaches" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coaches">Coach Management</TabsTrigger>
            <TabsTrigger value="outreach">Outreach Status</TabsTrigger>
          </TabsList>
          <TabsContent value="coaches">
            <CoachManagement />
          </TabsContent>
          <TabsContent value="outreach">
            <PendingOffers />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}