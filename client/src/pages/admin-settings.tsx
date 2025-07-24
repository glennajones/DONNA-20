import { useAuth } from "@/lib/auth";
import { Redirect, useLocation } from "wouter";
import UserManagement from "@/modules/Admin/UserManagement";
import SystemSettings from "@/modules/Admin/SystemSettings";
import DailyEmailSettings from "@/modules/Admin/DailyEmailSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Settings, Users, ExternalLink, Mail } from "lucide-react";

export default function AdminSettingsPage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

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

  // Only allow admin access
  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6">
        {/* Quick Access to Dashboard Configuration */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role & Dashboard Permissions
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Configure which dashboard modules are visible to each user role
                </p>
              </div>
              <Button
                onClick={() => setLocation('/admin-dashboard-config')}
                className="flex items-center gap-2"
              >
                Configure Permissions
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Settings
            </TabsTrigger>
            <TabsTrigger value="emails" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Daily Emails
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="system">
            <SystemSettings />
          </TabsContent>
          <TabsContent value="emails">
            <DailyEmailSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}