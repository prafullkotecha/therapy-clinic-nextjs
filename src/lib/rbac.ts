/**
 * Role-Based Access Control (RBAC) Utilities
 *
 * Defines permissions for different user roles in the therapy clinic system.
 * Based on HIPAA principle of least privilege.
 */

export const UserRoles = {
  ADMIN: 'admin',
  THERAPIST: 'therapist',
  BILLING: 'billing',
  RECEPTIONIST: 'receptionist',
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

export type Resource
  = | 'clients'
    | 'therapists'
    | 'appointments'
    | 'users'
    | 'tenants'
    | 'audit_logs'
    | 'billing'
    | 'reports'
    | 'specializations';

export type Action = 'create' | 'read' | 'update' | 'delete';

/**
 * Permission matrix defining what each role can do
 */
const PERMISSIONS: Record<UserRole, Record<Resource, Action[]>> = {
  admin: {
    clients: ['create', 'read', 'update', 'delete'],
    therapists: ['create', 'read', 'update', 'delete'],
    appointments: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    tenants: ['read', 'update'],
    audit_logs: ['read'],
    billing: ['create', 'read', 'update', 'delete'],
    reports: ['read'],
    specializations: ['create', 'read', 'update', 'delete'],
  },
  therapist: {
    clients: ['read', 'update'], // Only assigned clients
    therapists: ['read'], // Can view other therapists (for referrals)
    appointments: ['create', 'read', 'update'], // Own appointments
    users: [], // No user management
    tenants: [], // No tenant access
    audit_logs: [], // No audit access
    billing: ['read'], // Can view billing for own clients
    reports: ['read'], // Own performance reports
    specializations: ['read'], // Can view specializations
  },
  billing: {
    clients: ['read'], // View client info for billing
    therapists: ['read'], // View therapist info for billing
    appointments: ['read'], // View appointments for billing
    users: [], // No user management
    tenants: [], // No tenant access
    audit_logs: [], // No audit access
    billing: ['create', 'read', 'update'], // Full billing access
    reports: ['read'], // Billing reports
    specializations: ['read'], // Can view specializations
  },
  receptionist: {
    clients: ['create', 'read', 'update'], // Intake and scheduling
    therapists: ['read'], // View for scheduling
    appointments: ['create', 'read', 'update', 'delete'], // Full appointment management
    users: [], // No user management
    tenants: [], // No tenant access
    audit_logs: [], // No audit access
    billing: [], // No billing access
    reports: [], // No reports
    specializations: ['read'], // Can view specializations
  },
};

/**
 * Check if a user role has permission to perform an action on a resource
 *
 * @param role - User's role
 * @param resource - Resource being accessed
 * @param action - Action being performed
 * @returns true if permitted, false otherwise
 */
export function checkPermission(
  role: string | undefined,
  resource: Resource,
  action: Action,
): boolean {
  if (!role || !(role in PERMISSIONS)) {
    return false;
  }

  const permissions = PERMISSIONS[role as UserRole];
  const resourcePermissions = permissions[resource];

  return resourcePermissions.includes(action);
}

/**
 * Check if user can access a specific resource instance
 * For resources that require ownership checks (e.g., therapist can only access assigned clients)
 *
 * @param role - User's role
 * @param resource - Resource being accessed
 * @param action - Action being performed
 * @param resourceOwnerId - ID of the resource owner (e.g., therapist ID for appointment)
 * @param userId - ID of the current user
 * @returns true if permitted, false otherwise
 */
export function checkResourcePermission(
  role: string | undefined,
  resource: Resource,
  action: Action,
  resourceOwnerId: string | null,
  userId: string,
): boolean {
  // First check if role has general permission
  if (!checkPermission(role, resource, action)) {
    return false;
  }

  // Admins have full access
  if (role === UserRoles.ADMIN) {
    return true;
  }

  // For therapists, check ownership
  if (role === UserRoles.THERAPIST) {
    // Therapists can only access resources they own
    if (resource === 'clients' || resource === 'appointments') {
      return resourceOwnerId === userId;
    }
  }

  return true;
}

/**
 * Get all resources a role can access
 */
export function getAccessibleResources(role: string | undefined): Resource[] {
  if (!role || !(role in PERMISSIONS)) {
    return [];
  }

  const permissions = PERMISSIONS[role as UserRole];
  return Object.entries(permissions)
    .filter(([, actions]) => actions.length > 0)
    .map(([resource]) => resource as Resource);
}

/**
 * Get all actions a role can perform on a resource
 */
export function getResourceActions(
  role: string | undefined,
  resource: Resource,
): Action[] {
  if (!role || !(role in PERMISSIONS)) {
    return [];
  }

  return PERMISSIONS[role as UserRole][resource] || [];
}
