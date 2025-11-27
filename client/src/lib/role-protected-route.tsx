import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Permissions } from "@shared/schema";

export function RoleProtectedRoute({
  path,
  component: Component,
  requiredRole,
}: {
  path: string;
  component: () => React.JSX.Element;
  requiredRole: "admin" | "manager" | "employee";
}) {
  const { user, isLoading } = useAuth();
  
  const { data: permissions, isLoading: permissionsLoading } = useQuery<Permissions>({
    queryKey: ['/api/roles', user?.role, 'permissions'],
    queryFn: async () => {
      if (!user?.role) return null;
      const res = await fetch(`/api/roles/${user.role}/permissions`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user?.role,
  });

  if (isLoading || permissionsLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/login" />
      </Route>
    );
  }

  const hasAccess = checkRoleAccess(user.role, requiredRole, permissions);
  
  if (!hasAccess) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}

function checkRoleAccess(userRole: string, requiredRole: string, permissions?: Permissions | null): boolean {
  const roleHierarchy: Record<string, number> = {
    admin: 3,
    manager: 2,
    employee: 1,
  };

  if (roleHierarchy[userRole] !== undefined) {
    const userLevel = roleHierarchy[userRole];
    const requiredLevel = roleHierarchy[requiredRole];
    return userLevel >= requiredLevel;
  }

  if (permissions) {
    const requiredPermissions: Record<string, keyof Permissions> = {
      admin: 'canManageUsers',
      manager: 'canAccessAdmin',
      employee: 'canViewReports',
    };
    
    const requiredPermission = requiredPermissions[requiredRole];
    if (requiredPermission && permissions[requiredPermission]) {
      return true;
    }
  }

  return false;
}
