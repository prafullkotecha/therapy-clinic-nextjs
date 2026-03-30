import { describe, expect, it } from 'vitest';
import {
  checkPermission,
  getPermissionsForRole,
  hasPermissionOrThrow,
} from '@/lib/rbac';

describe('RBAC enhanced', () => {
  it('returns explicit permission matrix for each role', () => {
    const adminPermissions = getPermissionsForRole('admin');
    const therapistPermissions = getPermissionsForRole('therapist');
    const billingPermissions = getPermissionsForRole('billing');

    expect(adminPermissions?.clients).toEqual(['create', 'read', 'update', 'delete']);
    expect(therapistPermissions?.session_notes).toContain('create');
    expect(billingPermissions?.session_notes).toEqual([]);
  });

  it('enforces granular CRUD permissions by role and resource', () => {
    expect(checkPermission('admin', 'reports', 'delete')).toBe(false);
    expect(checkPermission('therapist', 'reports', 'delete')).toBe(false);
    expect(checkPermission('receptionist', 'billing', 'read')).toBe(false);
    expect(checkPermission('billing', 'billing', 'delete')).toBe(false);
  });

  it('returns null for unknown role permissions', () => {
    expect(getPermissionsForRole('unknown')).toBeNull();
  });

  it('permission middleware helper throws when forbidden', () => {
    expect(() => hasPermissionOrThrow('therapist', 'users', 'delete')).toThrow(/Forbidden/);
  });

  it('permission middleware helper allows authorized combinations', () => {
    expect(() => hasPermissionOrThrow('admin', 'users', 'delete')).not.toThrow();
  });
});
