'use client';

import type { Action, Resource, UserRole } from '../rbac';
import { UserRoles } from '../rbac';
import { useAuth } from './useAuth';

/**
 * Hook for role-based rendering and permission checks
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isAdmin, isTherapist, hasRole, hasAnyRole } = useRole();
 *
 *   if (isAdmin) {
 *     return <AdminPanel />;
 *   }
 *
 *   if (hasAnyRole(['therapist', 'receptionist'])) {
 *     return <ClientList />;
 *   }
 *
 *   return <AccessDenied />;
 * }
 * ```
 */
export function useRole() {
  const { userRole, userRoles, hasPermission, canAccessResource } = useAuth();

  const isAdmin = userRole === UserRoles.ADMIN;
  const isTherapist = userRole === UserRoles.THERAPIST;
  const isBilling = userRole === UserRoles.BILLING;
  const isReceptionist = userRole === UserRoles.RECEPTIONIST;

  /**
   * Check if user has a specific role (primary role)
   */
  const hasRole = (role: UserRole): boolean => {
    return userRole === role;
  };

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.includes(userRole);
  };

  /**
   * Check if user has all of the specified roles
   * (in their roles array, not just primary)
   */
  const hasAllRoles = (roles: UserRole[]): boolean => {
    return roles.every(role => userRoles.includes(role));
  };

  return {
    /** Current primary role */
    userRole,
    /** All user roles */
    userRoles,
    /** Is user an admin? */
    isAdmin,
    /** Is user a therapist? */
    isTherapist,
    /** Is user billing staff? */
    isBilling,
    /** Is user receptionist? */
    isReceptionist,
    /** Check if user has specific role */
    hasRole,
    /** Check if user has any of specified roles */
    hasAnyRole,
    /** Check if user has all specified roles */
    hasAllRoles,
    /** Check permission for resource action */
    hasPermission,
    /** Check resource access with ownership */
    canAccessResource,
  };
}

/**
 * Hook for permission-based component rendering
 * Returns boolean and helper components
 *
 * @example
 * ```tsx
 * function ClientsPage() {
 *   const { canCreate, canUpdate, canDelete } = usePermissions('clients');
 *
 *   return (
 *     <div>
 *       {canCreate && <CreateButton />}
 *       {canUpdate && <EditButton />}
 *       {canDelete && <DeleteButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions(resource: Resource) {
  const { hasPermission } = useAuth();

  const canCreate = hasPermission(resource, 'create');
  const canRead = hasPermission(resource, 'read');
  const canUpdate = hasPermission(resource, 'update');
  const canDelete = hasPermission(resource, 'delete');

  /**
   * Check specific action
   */
  const can = (action: Action): boolean => {
    return hasPermission(resource, action);
  };

  return {
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    can,
  };
}
