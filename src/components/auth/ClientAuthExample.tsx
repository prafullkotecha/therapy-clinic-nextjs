'use client';

import { signIn, signOut } from 'next-auth/react';
import { useAuth, usePermissions, useRole } from '@/lib/hooks';

/**
 * Example component demonstrating client-side auth hooks usage
 * This is for documentation/testing purposes
 */
export function ClientAuthExample() {
  const {
    session,
    isLoading,
    isAuthenticated,
    userRole,
    tenantId,
    hasPermission,
  } = useAuth();

  const { isAdmin, isTherapist, hasAnyRole } = useRole();
  const { canCreate, canUpdate, canDelete } = usePermissions('clients');

  if (isLoading) {
    return <div>Loading session...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <h2 className="mb-4 text-xl font-bold">Not authenticated</h2>
        <button
          type="button"
          onClick={() => signIn('keycloak')}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Auth Hook Examples</h2>

      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">Session Info</h3>
        <p>
          User:
          {session?.user?.name || 'Unknown'}
        </p>
        <p>
          Email:
          {session?.user?.email || 'Unknown'}
        </p>
        <p>
          Role:
          {userRole}
        </p>
        <p>
          Tenant:
          {tenantId || 'None'}
        </p>
      </div>

      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">Role Checks (useRole)</h3>
        <p>
          Is Admin:
          {isAdmin ? '✅' : '❌'}
        </p>
        <p>
          Is Therapist:
          {isTherapist ? '✅' : '❌'}
        </p>
        <p>
          Has any role (therapist, admin):
          {' '}
          {hasAnyRole(['therapist', 'admin']) ? '✅' : '❌'}
        </p>
      </div>

      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">Permission Checks (usePermissions)</h3>
        <p>
          Can create clients:
          {canCreate ? '✅' : '❌'}
        </p>
        <p>
          Can update clients:
          {canUpdate ? '✅' : '❌'}
        </p>
        <p>
          Can delete clients:
          {canDelete ? '✅' : '❌'}
        </p>
      </div>

      <div className="rounded border p-4">
        <h3 className="mb-2 font-semibold">Generic Permission Check (hasPermission)</h3>
        <p>
          Can read appointments:
          {' '}
          {hasPermission('appointments', 'read') ? '✅' : '❌'}
        </p>
        <p>
          Can create billing:
          {' '}
          {hasPermission('billing', 'create') ? '✅' : '❌'}
        </p>
      </div>

      <button
        type="button"
        onClick={() => signOut()}
        className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600"
      >
        Sign Out
      </button>
    </div>
  );
}
