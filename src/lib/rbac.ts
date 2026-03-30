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
    | 'session_notes'
    | 'users'
    | 'tenants'
    | 'audit_logs'
    | 'billing'
    | 'reports'
    | 'specializations'
    | 'matching';

export type Action = 'create' | 'read' | 'update' | 'delete';

/**
 * Permission matrix defining what each role can do
 */
const PERMISSIONS: Record<UserRole, Record<Resource, Action[]>> = {
  admin: {
    clients: ['create', 'read', 'update', 'delete'],
    therapists: ['create', 'read', 'update', 'delete'],
    appointments: ['create', 'read', 'update', 'delete'],
    session_notes: ['create', 'read', 'update', 'delete'],
    users: ['create', 'read', 'update', 'delete'],
    tenants: ['read', 'update'],
    audit_logs: ['read'],
    billing: ['create', 'read', 'update', 'delete'],
    reports: ['read'],
    specializations: ['create', 'read', 'update', 'delete'],
    matching: ['read'],
  },
  therapist: {
    clients: ['read', 'update'],
    therapists: ['read'],
    appointments: ['create', 'read', 'update'],
    session_notes: ['create', 'read', 'update'],
    users: [],
    tenants: [],
    audit_logs: [],
    billing: ['read'],
    reports: ['read'],
    specializations: ['read'],
    matching: ['read'],
  },
  billing: {
    clients: ['read'],
    therapists: ['read'],
    appointments: ['read'],
    session_notes: [],
    users: [],
    tenants: [],
    audit_logs: [],
    billing: ['create', 'read', 'update'],
    reports: ['read'],
    specializations: ['read'],
    matching: [],
  },
  receptionist: {
    clients: ['create', 'read', 'update'],
    therapists: ['read'],
    appointments: ['create', 'read', 'update', 'delete'],
    session_notes: ['read'],
    users: [],
    tenants: [],
    audit_logs: [],
    billing: [],
    reports: [],
    specializations: ['read'],
    matching: ['read'],
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
    if (resource === 'clients' || resource === 'appointments' || resource === 'session_notes') {
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

export function getPermissionsForRole(role: string): Record<Resource, Action[]> | null {
  if (!(role in PERMISSIONS)) {
    return null;
  }

  return { ...PERMISSIONS[role as UserRole] };
}

export function hasPermissionOrThrow(
  role: string | undefined,
  resource: Resource,
  action: Action,
): void {
  if (!checkPermission(role, resource, action)) {
    throw new Error(`Forbidden: ${role ?? 'unknown'} cannot ${action} ${resource}`);
  }
}
