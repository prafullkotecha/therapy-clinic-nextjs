'use client';

import type { Action, Resource, UserRole } from '../rbac';
import { useSession } from 'next-auth/react';
import { checkPermission, checkResourcePermission } from '../rbac';
import { extractPrimaryRole } from '../role-utils';

export type AuthUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles: string[];
  tenantId: string;
};

export type AuthSession = {
  user: AuthUser;
  accessToken: string;
  idToken: string;
};

export type UseAuthReturn = {
  /** Current session data, or null if not authenticated */
  session: AuthSession | null;
  /** Loading state */
  isLoading: boolean;
  /** Authenticated state */
  isAuthenticated: boolean;
  /** Primary user role (highest priority if multiple) */
  userRole: UserRole;
  /** All user roles */
  userRoles: string[];
  /** Tenant ID from session */
  tenantId: string | null;
  /** User ID from session */
  userId: string | null;
  /** Access token for API calls */
  accessToken: string | null;
  /** ID token */
  idToken: string | null;
  /** Check if user has permission for resource action */
  hasPermission: (resource: Resource, action: Action) => boolean;
  /** Check if user can access specific resource instance (ownership check) */
  canAccessResource: (
    resource: Resource,
    action: Action,
    resourceOwnerId: string | null,
  ) => boolean;
};

/**
 * Client-side auth hook for React components
 * Wraps next-auth's useSession with app-specific helpers
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { session, isAuthenticated, userRole, hasPermission } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <SignInPrompt />;
 *   }
 *
 *   const canCreateClient = hasPermission('clients', 'create');
 *
 *   return (
 *     <div>
 *       <h1>Welcome {session.user.name}</h1>
 *       {canCreateClient && <CreateClientButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuth(): UseAuthReturn {
  const { data: sessionData, status } = useSession();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!sessionData;

  // Type-safe session extraction
  const session: AuthSession | null = sessionData
    ? {
        user: {
          id: sessionData.user?.id || '',
          name: sessionData.user?.name,
          email: sessionData.user?.email,
          image: sessionData.user?.image,
          roles: sessionData.user?.roles || [],
          tenantId: sessionData.user?.tenantId || '',
        },
        accessToken: sessionData.accessToken || '',
        idToken: sessionData.idToken || '',
      }
    : null;

  const userRoles = session?.user?.roles || [];
  const userRole = extractPrimaryRole(userRoles);
  const tenantId = session?.user?.tenantId || null;
  const userId = session?.user?.id || null;
  const accessToken = session?.accessToken || null;
  const idToken = session?.idToken || null;

  /**
   * Check if user has permission for a general resource action
   */
  const hasPermission = (resource: Resource, action: Action): boolean => {
    return checkPermission(userRole, resource, action);
  };

  /**
   * Check if user can access a specific resource instance
   * Includes ownership checks for role-based restrictions
   */
  const canAccessResource = (
    resource: Resource,
    action: Action,
    resourceOwnerId: string | null,
  ): boolean => {
    if (!userId) {
      return false;
    }
    return checkResourcePermission(userRole, resource, action, resourceOwnerId, userId);
  };

  return {
    session,
    isLoading,
    isAuthenticated,
    userRole,
    userRoles,
    tenantId,
    userId,
    accessToken,
    idToken,
    hasPermission,
    canAccessResource,
  };
}
