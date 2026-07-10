import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { hasMinimumRole, normalizeRole, ROLES } from '@/lib/roles';

const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  fallbackPath?: string;
}

export const ProtectedRoute = ({
  children,
  requiredRole = ROLES.EMPLOYEE,
  fallbackPath = '/auth',
}: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(AUTH_DISABLED);

  useEffect(() => {
    if (AUTH_DISABLED) {
      setAllowed(true);
      setLoading(false);
      return;
    }

    (async () => {
      const { data: { session } } = await api.auth.getSession();
      if (!session) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      const { data: roleData } = await api
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const userRole = normalizeRole(roleData?.role || session.role);
      setAllowed(hasMinimumRole(userRole, requiredRole));
      setLoading(false);
    })();
  }, [requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!allowed) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
