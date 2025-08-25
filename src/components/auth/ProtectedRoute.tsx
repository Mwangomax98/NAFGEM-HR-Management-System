import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { hasMinimumRole, AppRole } from "@/lib/roles";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: AppRole;
  fallbackPath?: string;
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  fallbackPath = "/" 
}: ProtectedRouteProps) => {
  const { userRole, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && userRole && !hasMinimumRole(userRole, requiredRole)) {
      navigate(fallbackPath);
    }
  }, [userRole, loading, requiredRole, fallbackPath, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userRole || !hasMinimumRole(userRole, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};