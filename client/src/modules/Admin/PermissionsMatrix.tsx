import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Shield, Save, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ROLES = ['admin', 'manager', 'coach', 'staff', 'player', 'parent'];
const PAGES = [
  { key: 'events', label: 'Events & Budgeting', description: 'Event creation, budgeting, and management' },
  { key: 'coach_resources', label: 'Coach Resources', description: 'File uploads, practice library, and time tracking' },
  { key: 'players', label: 'Player Management', description: 'Player profiles, teams, and status management' },
  { key: 'communications', label: 'Communications', description: 'Team messaging and announcements' },
  { key: 'fundraising', label: 'Fundraising', description: 'Campaigns and sponsor management' },
  { key: 'scheduling', label: 'Training & Scheduling', description: 'Calendar events and court scheduling' },
  { key: 'forms', label: 'Forms & Checklists', description: 'Custom forms and response management' },
  { key: 'documents', label: 'Documents & Signatures', description: 'Document repository and e-signatures' },
  { key: 'performance', label: 'Performance Tracking', description: 'Statistics and analytics' },
  { key: 'integrations', label: 'Integrations', description: 'Google Calendar and external services' }
];

const PERMISSION_TYPES = [
  { key: 'canView', label: 'View', description: 'Can see and access the page' },
  { key: 'canCreate', label: 'Create', description: 'Can create new items' },
  { key: 'canEdit', label: 'Edit', description: 'Can modify existing items' },
  { key: 'canDelete', label: 'Delete', description: 'Can remove items' }
];

interface Permission {
  id?: number;
  role: string;
  page: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export default function PermissionsMatrix() {
  const { hasRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [matrix, setMatrix] = useState<Record<string, Permission>>({});

  // Fetch current permissions
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['/api/permissions'],
    queryFn: async () => {
      const response = await fetch('/api/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch permissions');
      const data = await response.json();
      
      const map: Record<string, Permission> = {};
      data.forEach((perm: Permission) => {
        map[`${perm.role}-${perm.page}`] = perm;
      });
      
      // Initialize missing combinations with defaults
      ROLES.forEach(role => {
        PAGES.forEach(page => {
          const key = `${role}-${page.key}`;
          if (!map[key]) {
            map[key] = {
              role,
              page: page.key,
              canView: role === 'admin', // Admin can view everything by default
              canCreate: role === 'admin',
              canEdit: role === 'admin',
              canDelete: role === 'admin'
            };
          }
        });
      });
      
      setMatrix(map);
      return data;
    },

  });

  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: async (permissions: Permission[]) => {
      const response = await apiRequest('POST', '/api/permissions', { permissions });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/permissions'] });
      toast({
        title: "Success",
        description: "Permissions matrix saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save permissions",
        variant: "destructive",
      });
    }
  });

  const togglePermission = (role: string, page: string, permType: string) => {
    const key = `${role}-${page}`;
    setMatrix(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [permType]: !prev[key]?.[permType as keyof Permission]
      }
    }));
  };

  const setRolePermissions = (role: string, permType: string, value: boolean) => {
    setMatrix(prev => {
      const updated = { ...prev };
      PAGES.forEach(page => {
        const key = `${role}-${page.key}`;
        updated[key] = {
          ...updated[key],
          [permType]: value
        };
      });
      return updated;
    });
  };

  const setPagePermissions = (page: string, permType: string, value: boolean) => {
    setMatrix(prev => {
      const updated = { ...prev };
      ROLES.forEach(role => {
        const key = `${role}-${page}`;
        updated[key] = {
          ...updated[key],
          [permType]: value
        };
      });
      return updated;
    });
  };

  const handleSave = () => {
    const permissionsArray = Object.values(matrix);
    savePermissionsMutation.mutate(permissionsArray);
  };

  const resetToDefaults = () => {
    const defaultMatrix: Record<string, Permission> = {};
    ROLES.forEach(role => {
      PAGES.forEach(page => {
        const key = `${role}-${page.key}`;
        // Set sensible defaults based on role
        const isAdmin = role === 'admin';
        const isManager = role === 'manager';
        const isCoach = role === 'coach';
        
        defaultMatrix[key] = {
          role,
          page: page.key,
          canView: isAdmin || isManager || (isCoach && ['coach_resources', 'scheduling', 'players'].includes(page.key)),
          canCreate: isAdmin || (isManager && page.key !== 'integrations'),
          canEdit: isAdmin || (isManager && page.key !== 'integrations'),
          canDelete: isAdmin
        };
      });
    });
    setMatrix(defaultMatrix);
  };

  if (!hasRole(['admin'])) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">Admin access required to manage permissions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Permissions Matrix
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Control what each user role can do across different pages and features
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetToDefaults}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset Defaults
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={savePermissionsMutation.isPending}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {savePermissionsMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-3 text-left">
                    <div className="font-semibold">Page / Feature</div>
                  </th>
                  {ROLES.map(role => (
                    <th key={role} className="border border-gray-300 px-3 py-3 text-center min-w-[140px]">
                      <div className="font-semibold capitalize mb-2">{role}</div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {PERMISSION_TYPES.map(perm => (
                          <Button
                            key={perm.key}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setRolePermissions(role, perm.key, 
                              !PAGES.every(p => matrix[`${role}-${p.key}`]?.[perm.key as keyof Permission])
                            )}
                          >
                            {perm.label}
                          </Button>
                        ))}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PAGES.map(page => (
                  <tr key={page.key} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="font-medium">{page.label}</div>
                      <div className="text-sm text-gray-500">{page.description}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {PERMISSION_TYPES.map(perm => (
                          <Button
                            key={perm.key}
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setPagePermissions(page.key, perm.key,
                              !ROLES.every(r => matrix[`${r}-${page.key}`]?.[perm.key as keyof Permission])
                            )}
                          >
                            {perm.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                    {ROLES.map(role => {
                      const key = `${role}-${page.key}`;
                      const perms = matrix[key] || {};
                      return (
                        <td key={key} className="border border-gray-300 px-3 py-3">
                          <div className="space-y-2">
                            {PERMISSION_TYPES.map(perm => (
                              <div key={perm.key} className="flex items-center space-x-2">
                                <Checkbox
                                  checked={Boolean(perms[perm.key as keyof Permission])}
                                  onCheckedChange={() => togglePermission(role, page.key, perm.key)}
                                />
                                <label className="text-sm cursor-pointer" 
                                       onClick={() => togglePermission(role, page.key, perm.key)}>
                                  {perm.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">Permission Types</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {PERMISSION_TYPES.map(perm => (
              <div key={perm.key} className="text-blue-800">
                <span className="font-medium">{perm.label}:</span> {perm.description}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}