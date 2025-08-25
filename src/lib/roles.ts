// Centralized role management constants and utilities

export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr', 
  EMPLOYEE: 'employee'
} as const;

export type AppRole = typeof ROLES[keyof typeof ROLES];

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.HR]: 'HR Staff',
  [ROLES.EMPLOYEE]: 'Employee'
} as const;

export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Full system access',
  [ROLES.HR]: 'HR management access', 
  [ROLES.EMPLOYEE]: 'Basic employee access'
} as const;

// Role hierarchy for permissions
export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 3,
  [ROLES.HR]: 2,
  [ROLES.EMPLOYEE]: 1
} as const;

// Helper functions
export const hasRole = (userRole: string | undefined, requiredRole: AppRole): boolean => {
  if (!userRole) return false;
  return userRole.toLowerCase() === requiredRole;
};

export const hasAnyRole = (userRole: string | undefined, requiredRoles: AppRole[]): boolean => {
  if (!userRole) return false;
  return requiredRoles.some(role => hasRole(userRole, role));
};

export const hasMinimumRole = (userRole: string | undefined, minimumRole: AppRole): boolean => {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[userRole.toLowerCase() as AppRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[minimumRole];
  return userLevel >= requiredLevel;
};

export const getRoleLabel = (role: string): string => {
  return ROLE_LABELS[role.toLowerCase() as AppRole] || role;
};

export const getRoleDescription = (role: string): string => {
  return ROLE_DESCRIPTIONS[role.toLowerCase() as AppRole] || '';
};