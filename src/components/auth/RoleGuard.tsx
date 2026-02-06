import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type AppRole = "admin" | "operator" | "viewer";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: AppRole[];
  fallback?: React.ReactNode;
}

const roleHierarchy: Record<AppRole, number> = {
  admin: 3,
  operator: 2,
  viewer: 1,
};

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { role, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return null;
  }

  if (!role || !allowedRoles.includes(role)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-7 w-7 text-destructive" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page. This area is
              restricted to {allowedRoles.join(" or ")} users.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Helper hook to check if user has at least a certain role level
export function useHasRole(minRole: AppRole): boolean {
  const { role } = useAuth();
  if (!role) return false;
  return roleHierarchy[role] >= roleHierarchy[minRole];
}

// Helper hook to check if user has any of the specified roles
export function useHasAnyRole(roles: AppRole[]): boolean {
  const { role } = useAuth();
  if (!role) return false;
  return roles.includes(role);
}
