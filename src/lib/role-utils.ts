import type { UserRole } from './rbac';
import { UserRoles } from './rbac';

/**
 * Extract the primary application role from a list of Keycloak roles
 * Keycloak returns many roles, we need to filter for our app-specific ones
 */
export function extractPrimaryRole(roles: string[] | undefined): UserRole {
  if (!roles || roles.length === 0) {
    console.warn('No roles found in session, defaulting to therapist');
    return UserRoles.THERAPIST;
  }

  // Define priority order for roles (in case user has multiple)
  const rolePriority: UserRole[] = [
    UserRoles.ADMIN,
    UserRoles.BILLING,
    UserRoles.RECEPTIONIST,
    UserRoles.THERAPIST,
  ];

  // Filter to only our application roles
  const appRoles = roles.filter(role =>
    Object.values(UserRoles).includes(role as UserRole),
  );

  if (appRoles.length === 0) {
    console.warn('No application roles found in Keycloak roles:', roles);
  }

  // Return the highest priority role
  for (const priorityRole of rolePriority) {
    if (appRoles.includes(priorityRole)) {
      return priorityRole;
    }
  }

  // Fallback to first app role or therapist
  const selectedRole = (appRoles[0] as UserRole) || UserRoles.THERAPIST;
  if (selectedRole === UserRoles.THERAPIST && appRoles.length === 0) {
    console.warn('No app roles found, defaulting to therapist. Available roles:', roles);
  }
  return selectedRole;
}
