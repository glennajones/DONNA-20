import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

interface Permission {
  role: string;
  page: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export function usePermissions() {
  const { user } = useAuth();
  
  const { data: permissions = [] } = useQuery({
    queryKey: ['/api/permissions'],
    queryFn: async () => {
      const response = await fetch('/api/permissions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user
  });

  const checkPermission = (page: string, action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete'): boolean => {
    if (!user) return false;
    
    // Admin always has all permissions
    if (user.role === 'admin') return true;
    
    const permission = permissions.find((p: Permission) => 
      p.role === user.role && p.page === page
    );
    
    if (!permission) {
      // Default permissions for missing entries
      return action === 'canView' && ['manager', 'coach'].includes(user.role);
    }
    
    return permission[action] || false;
  };

  const canView = (page: string) => checkPermission(page, 'canView');
  const canCreate = (page: string) => checkPermission(page, 'canCreate');
  const canEdit = (page: string) => checkPermission(page, 'canEdit');
  const canDelete = (page: string) => checkPermission(page, 'canDelete');

  return {
    permissions,
    checkPermission,
    canView,
    canCreate,
    canEdit,
    canDelete
  };
}