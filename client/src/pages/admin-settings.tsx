import { useAuth } from "@/lib/auth";
import { Redirect } from "wouter";
import UserManagement from "@/modules/Admin/UserManagement";
import SystemSettings from "@/modules/Admin/SystemSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Settings, Users } from "lucide-react";

export default function AdminSettingsPage() {
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
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role Permissions
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Settings
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
          <TabsContent value="permissions">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Dashboard Module Permissions
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure which user roles can access each dashboard module. This controls what appears on each user's main dashboard.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Role-Based Permissions
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        This feature controls which dashboard modules are visible to different user roles.
                        Currently configured through the API endpoints.
                      </p>
                      <p className="text-sm text-gray-500">
                        Available at: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">/api/dashboard/widget-permissions</code>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Current Role Defaults</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="destructive">Admin</Badge>
                        <span className="text-sm text-gray-500">Full access to all modules</span>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="default">Manager</Badge>
                        <span className="text-sm text-gray-500">Most modules except integrations</span>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">Coach</Badge>
                        <span className="text-sm text-gray-500">Training, members, forms, resources</span>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">Staff</Badge>
                        <span className="text-sm text-gray-500">Coach resources and time tracking</span>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">Player/Parent</Badge>
                        <span className="text-sm text-gray-500">Training schedule and registration</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="system">
            <SystemSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}