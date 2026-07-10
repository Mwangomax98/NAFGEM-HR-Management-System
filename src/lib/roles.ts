// NAFGEM HR role management

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HR_ADMIN: 'hr_admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  FIELD_OFFICER: 'field_officer',
  // Legacy aliases
  ADMIN: 'super_admin',
  HR: 'hr_admin',
} as const;

export type AppRole =
  | 'super_admin'
  | 'hr_admin'
  | 'manager'
  | 'employee'
  | 'field_officer'
  | 'admin'
  | 'hr';

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  hr_admin: 'HR Admin',
  manager: 'Manager',
  employee: 'Employee',
  field_officer: 'Field Officer',
  admin: 'Super Admin',
  hr: 'HR Admin',
};

export const ROLE_DESCRIPTIONS: Record<string, string> = {
  super_admin: 'Full system access',
  hr_admin: 'HR management, all records, staff request review',
  manager: 'Team-scoped access via manager_id',
  employee: 'Own profile, tasks, leave, staff requests, field reports',
  field_officer: 'Submit and view own field reports only',
};

export const ROLE_HIERARCHY: Record<string, number> = {
  field_officer: 1,
  employee: 2,
  manager: 3,
  hr_admin: 4,
  hr: 4,
  super_admin: 5,
  admin: 5,
};

export const normalizeRole = (role?: string): AppRole => {
  if (!role) return ROLES.EMPLOYEE;
  const r = role.toLowerCase();
  if (r === 'admin') return ROLES.SUPER_ADMIN;
  if (r === 'hr') return ROLES.HR_ADMIN;
  return r as AppRole;
};

export const hasRole = (userRole: string | undefined, requiredRole: string): boolean => {
  if (!userRole) return false;
  return normalizeRole(userRole) === normalizeRole(requiredRole);
};

export const hasAnyRole = (userRole: string | undefined, requiredRoles: string[]): boolean => {
  if (!userRole) return false;
  const normalized = normalizeRole(userRole);
  return requiredRoles.some((role) => normalizeRole(role) === normalized);
};

export const hasMinimumRole = (userRole: string | undefined, minimumRole: string): boolean => {
  if (!userRole) return false;
  const userLevel = ROLE_HIERARCHY[normalizeRole(userRole)] || 0;
  const requiredLevel = ROLE_HIERARCHY[normalizeRole(minimumRole)] || 0;
  return userLevel >= requiredLevel;
};

export const getRoleLabel = (role: string): string => ROLE_LABELS[normalizeRole(role)] || role;
export const getRoleDescription = (role: string): string => ROLE_DESCRIPTIONS[normalizeRole(role)] || '';

export const isHrOrAbove = (role?: string) => hasMinimumRole(role, ROLES.HR_ADMIN);
export const isAdmin = (role?: string) => hasMinimumRole(role, ROLES.SUPER_ADMIN);
