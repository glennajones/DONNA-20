import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Settings,
  Users,
  Layout,
  Shield,
  Eye,
  Edit,
  Plus
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface RolePermission {
  widgetId: number;
  canView: boolean;
  canManage: boolean;
}

export default function AdminDashboardConfig() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("admin");

  // Fetch dashboard widgets
  const { data: widgets = [], isLoading: widgetsLoading } = useQuery({
    queryKey: ['/api/admin/dashboard-widgets'],
    enabled: hasRole(["admin"]), // Only fetch if admin
  });

  // Fetch role permissions
  const { data: rolePermissions = [] as RolePermission[], isLoading: permissionsLoading } = useQuery({
    queryKey: ['/api/admin/role-permissions', selectedRole],
    enabled: hasRole(["admin"]), // Only fetch if admin
  });

  // Mutation to update role permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: (data: { role: string; widgetId: number; canView: boolean; canManage: boolean }) =>
      apiRequest(`/api/admin/role-permissions`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/admin/role-permissions', variables.role] });
      
      // Snapshot the previous value
      const previousPermissions = queryClient.getQueryData(['/api/admin/role-permissions', variables.role]);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/admin/role-permissions', variables.role], (old: any) => {
        if (!old) return old;
        return old.map((perm: RolePermission) => 
          perm.widgetId === variables.widgetId 
            ? { ...perm, canView: variables.canView, canManage: variables.canManage }
            : perm
        );
      });
      
      // Return a context object with the snapshotted value
      return { previousPermissions, variables };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPermissions) {
        queryClient.setQueryData(['/api/admin/role-permissions', variables.role], context.previousPermissions);
      }
      toast({
        title: "Update Failed",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/role-permissions', variables.role] });
    },
    onSuccess: () => {
      toast({
        title: "Permissions Updated",
        description: "Role permissions have been successfully updated.",
      });
    },
  });

  const roles = [
    { id: "admin", name: "Admin", color: "destructive" },
    { id: "manager", name: "Manager", color: "default" },
    { id: "coach", name: "Coach", color: "secondary" },
    { id: "staff", name: "Staff", color: "secondary" },
    { id: "player", name: "Player", color: "outline" },
    { id: "parent", name: "Parent", color: "outline" },
  ];

  const defaultWidgets = [
    { name: "Members", component: "members", description: "Player and parent management", defaultRoles: ["admin", "manager"] },
    { name: "Training & Scheduling", component: "training", description: "Manage training sessions", defaultRoles: ["admin", "manager", "coach"] },
    { name: "Communication", component: "communication", description: "Team communication tools", defaultRoles: ["admin", "manager", "coach"] },
    { name: "Events", component: "events", description: "Event planning and budgeting", defaultRoles: ["admin", "manager"] },
    { name: "Coach Resources", component: "coach-resources", description: "Tools for coaching teams", defaultRoles: ["admin", "manager", "coach", "staff"] },
    { name: "Podcast", component: "podcast", description: "Volleyball podcast episodes", defaultRoles: ["admin", "manager", "coach", "player", "parent"] },
    { name: "Forms, Checklists & Reports", component: "forms", description: "Create forms and generate reports", defaultRoles: ["admin", "manager"] },
    { name: "Admin", component: "admin-settings", description: "System settings and user management", defaultRoles: ["admin"] },
  ];

  // Redirect if not admin - placed after all hooks
  if (!hasRole(["admin"])) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Access Denied</h1>
            <p className="text-gray-600 mt-2">You need admin privileges to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  const togglePermission = (widgetId: number, type: 'canView' | 'canManage', currentValue: boolean) => {
    const typedPermissions = rolePermissions as RolePermission[];
    const permission = typedPermissions.find((p: RolePermission) => p.widgetId === widgetId);
    
    updatePermissionsMutation.mutate({
      role: selectedRole,
      widgetId,
      canView: type === 'canView' ? !currentValue : permission?.canView || false,
      canManage: type === 'canManage' ? !currentValue : permission?.canManage || false,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Configuration</h1>
              <p className="mt-1 text-sm text-gray-600">
                Configure dashboard widgets and permissions for different user roles.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="permissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Role Permissions
            </TabsTrigger>
            <TabsTrigger value="widgets" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Widget Management
            </TabsTrigger>
          </TabsList>

          {/* Role Permissions Tab */}
          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Configure Role Permissions
                </CardTitle>
                <div className="flex gap-2 mt-4">
                  {roles.map((role) => (
                    <Button
                      key={role.id}
                      variant={selectedRole === role.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedRole(role.id)}
                    >
                      {role.name}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {permissionsLoading ? (
                  <div className="text-center py-8">Loading permissions...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Widget</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center">Can View</TableHead>
                        <TableHead className="text-center">Can Manage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {defaultWidgets.map((widget, index) => {
                        const typedPermissions = rolePermissions as RolePermission[];
                        const permission = typedPermissions.find((p: RolePermission) => p.widgetId === index + 1);
                        // Use explicit permission values if they exist, otherwise fall back to defaults
                        const canView = permission !== undefined ? permission.canView : widget.defaultRoles.includes(selectedRole);
                        const canManage = permission !== undefined ? permission.canManage : (selectedRole === 'admin' && widget.defaultRoles.includes('admin'));
                        
                        return (
                          <TableRow key={widget.component}>
                            <TableCell className="font-medium">{widget.name}</TableCell>
                            <TableCell className="text-gray-600">{widget.description}</TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={canView}
                                onCheckedChange={() => togglePermission(index + 1, 'canView', canView)}
                                disabled={updatePermissionsMutation.isPending}
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={canManage}
                                onCheckedChange={() => togglePermission(index + 1, 'canManage', canManage)}
                                disabled={updatePermissionsMutation.isPending || !canView}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Widget Management Tab */}
          <TabsContent value="widgets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Dashboard Widgets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {defaultWidgets.map((widget) => (
                    <Card key={widget.component} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{widget.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{widget.description}</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {widget.defaultRoles.map((role) => (
                                <Badge key={role} variant="outline" className="text-xs">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}