const ROLE_RANK = {
  field_officer: 1,
  employee: 2,
  manager: 3,
  hr_admin: 4,
  super_admin: 5,
  admin: 5,
  hr: 4,
};

export function getRoleRank(role) {
  return ROLE_RANK[role] || 0;
}

export function hasMinimumRole(userRole, minimumRole) {
  return getRoleRank(userRole) >= getRoleRank(minimumRole);
}

const HR_ROLES = new Set(['hr_admin', 'super_admin', 'hr', 'admin']);
const MANAGER_PLUS = new Set(['manager', 'hr_admin', 'super_admin', 'hr', 'admin']);

export function canAccessFieldReport(userRole, userId, reportOwnerId, teamMemberIds = []) {
  if (userRole === 'field_officer') return userId === reportOwnerId;
  if (HR_ROLES.has(userRole)) return true;
  if (userRole === 'manager') {
    return userId === reportOwnerId || teamMemberIds.includes(reportOwnerId);
  }
  return userId === reportOwnerId;
}

export function filterTableAccess(table, userRole, userId) {
  if (HR_ROLES.has(userRole) || userRole === 'super_admin' || userRole === 'admin') {
    return null;
  }
  if (table === 'employee_certifications' || table === 'external_trainings') {
    return { column: 'employee_id', value: userId };
  }
  if (table === 'staff_requests') {
    if (userRole === 'employee' || userRole === 'field_officer' || userRole === 'manager') {
      return { column: 'requester_id', value: userId };
    }
  }
  if (table === 'field_activity_reports') {
    if (userRole === 'field_officer' || userRole === 'employee') {
      return { column: 'submitted_by', value: userId };
    }
  }
  return null;
}
