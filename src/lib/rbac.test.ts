import type { Action, Resource } from './rbac';
import { describe, expect, it } from 'vitest';
import {

  checkPermission,
  checkResourcePermission,
  getAccessibleResources,
  getResourceActions,

  UserRoles,
} from './rbac';

describe('RBAC', () => {
  describe('checkPermission', () => {
    describe('admin role', () => {
      it('should have full access to clients', () => {
        expect(checkPermission('admin', 'clients', 'create')).toBe(true);
        expect(checkPermission('admin', 'clients', 'read')).toBe(true);
        expect(checkPermission('admin', 'clients', 'update')).toBe(true);
        expect(checkPermission('admin', 'clients', 'delete')).toBe(true);
      });

      it('should have full access to users', () => {
        expect(checkPermission('admin', 'users', 'create')).toBe(true);
        expect(checkPermission('admin', 'users', 'delete')).toBe(true);
      });

      it('should have read access to audit logs', () => {
        expect(checkPermission('admin', 'audit_logs', 'read')).toBe(true);
      });

      it('should have full access to billing', () => {
        expect(checkPermission('admin', 'billing', 'create')).toBe(true);
        expect(checkPermission('admin', 'billing', 'read')).toBe(true);
        expect(checkPermission('admin', 'billing', 'update')).toBe(true);
        expect(checkPermission('admin', 'billing', 'delete')).toBe(true);
      });
    });

    describe('therapist role', () => {
      it('should have read/update access to clients only', () => {
        expect(checkPermission('therapist', 'clients', 'read')).toBe(true);
        expect(checkPermission('therapist', 'clients', 'update')).toBe(true);
        expect(checkPermission('therapist', 'clients', 'create')).toBe(false);
        expect(checkPermission('therapist', 'clients', 'delete')).toBe(false);
      });

      it('should not have user management access', () => {
        expect(checkPermission('therapist', 'users', 'create')).toBe(false);
        expect(checkPermission('therapist', 'users', 'delete')).toBe(false);
      });

      it('should not have audit log access', () => {
        expect(checkPermission('therapist', 'audit_logs', 'read')).toBe(false);
      });

      it('should have read-only billing access', () => {
        expect(checkPermission('therapist', 'billing', 'read')).toBe(true);
        expect(checkPermission('therapist', 'billing', 'create')).toBe(false);
        expect(checkPermission('therapist', 'billing', 'update')).toBe(false);
        expect(checkPermission('therapist', 'billing', 'delete')).toBe(false);
      });

      it('should have appointment management access', () => {
        expect(checkPermission('therapist', 'appointments', 'create')).toBe(true);
        expect(checkPermission('therapist', 'appointments', 'read')).toBe(true);
        expect(checkPermission('therapist', 'appointments', 'update')).toBe(true);
        expect(checkPermission('therapist', 'appointments', 'delete')).toBe(false);
      });
    });

    describe('billing role', () => {
      it('should have read-only access to clients', () => {
        expect(checkPermission('billing', 'clients', 'read')).toBe(true);
        expect(checkPermission('billing', 'clients', 'create')).toBe(false);
        expect(checkPermission('billing', 'clients', 'update')).toBe(false);
        expect(checkPermission('billing', 'clients', 'delete')).toBe(false);
      });

      it('should have full billing access except delete', () => {
        expect(checkPermission('billing', 'billing', 'create')).toBe(true);
        expect(checkPermission('billing', 'billing', 'read')).toBe(true);
        expect(checkPermission('billing', 'billing', 'update')).toBe(true);
        expect(checkPermission('billing', 'billing', 'delete')).toBe(false);
      });

      it('should not have user management access', () => {
        expect(checkPermission('billing', 'users', 'create')).toBe(false);
        expect(checkPermission('billing', 'users', 'delete')).toBe(false);
      });

      it('should have read access to reports', () => {
        expect(checkPermission('billing', 'reports', 'read')).toBe(true);
      });
    });

    describe('receptionist role', () => {
      it('should have create/read/update access to clients', () => {
        expect(checkPermission('receptionist', 'clients', 'create')).toBe(true);
        expect(checkPermission('receptionist', 'clients', 'read')).toBe(true);
        expect(checkPermission('receptionist', 'clients', 'update')).toBe(true);
        expect(checkPermission('receptionist', 'clients', 'delete')).toBe(false);
      });

      it('should have full appointment management', () => {
        expect(checkPermission('receptionist', 'appointments', 'create')).toBe(true);
        expect(checkPermission('receptionist', 'appointments', 'read')).toBe(true);
        expect(checkPermission('receptionist', 'appointments', 'update')).toBe(true);
        expect(checkPermission('receptionist', 'appointments', 'delete')).toBe(true);
      });

      it('should not have billing access', () => {
        expect(checkPermission('receptionist', 'billing', 'read')).toBe(false);
        expect(checkPermission('receptionist', 'billing', 'create')).toBe(false);
      });

      it('should not have user management access', () => {
        expect(checkPermission('receptionist', 'users', 'create')).toBe(false);
        expect(checkPermission('receptionist', 'users', 'delete')).toBe(false);
      });

      it('should not have report access', () => {
        expect(checkPermission('receptionist', 'reports', 'read')).toBe(false);
      });
    });

    describe('edge cases', () => {
      it('should return false for undefined role', () => {
        expect(checkPermission(undefined, 'clients', 'read')).toBe(false);
      });

      it('should return false for invalid role', () => {
        expect(checkPermission('invalid-role', 'clients', 'read')).toBe(false);
      });

      it('should return false for empty string role', () => {
        expect(checkPermission('', 'clients', 'read')).toBe(false);
      });
    });
  });

  describe('checkResourcePermission', () => {
    const userId = 'user-123';
    const resourceOwnerId = 'user-456';

    it('should allow admin full access regardless of ownership', () => {
      expect(
        checkResourcePermission(
          UserRoles.ADMIN,
          'clients',
          'read',
          resourceOwnerId,
          userId,
        ),
      ).toBe(true);
    });

    it('should allow therapist to access only their own clients', () => {
      // Own client
      expect(
        checkResourcePermission(
          UserRoles.THERAPIST,
          'clients',
          'read',
          userId,
          userId,
        ),
      ).toBe(true);

      // Someone else's client
      expect(
        checkResourcePermission(
          UserRoles.THERAPIST,
          'clients',
          'read',
          resourceOwnerId,
          userId,
        ),
      ).toBe(false);
    });

    it('should allow therapist to access only their own appointments', () => {
      // Own appointment
      expect(
        checkResourcePermission(
          UserRoles.THERAPIST,
          'appointments',
          'read',
          userId,
          userId,
        ),
      ).toBe(true);

      // Someone else's appointment
      expect(
        checkResourcePermission(
          UserRoles.THERAPIST,
          'appointments',
          'read',
          resourceOwnerId,
          userId,
        ),
      ).toBe(false);
    });

    it('should return false if role lacks general permission', () => {
      expect(
        checkResourcePermission(
          UserRoles.THERAPIST,
          'users',
          'create',
          userId,
          userId,
        ),
      ).toBe(false);
    });

    it('should return false for undefined role', () => {
      expect(
        checkResourcePermission(
          undefined,
          'clients',
          'read',
          userId,
          userId,
        ),
      ).toBe(false);
    });
  });

  describe('getAccessibleResources', () => {
    it('should return all resources for admin', () => {
      const resources = getAccessibleResources('admin');

      expect(resources).toContain('clients');
      expect(resources).toContain('therapists');
      expect(resources).toContain('appointments');
      expect(resources).toContain('users');
      expect(resources).toContain('audit_logs');
      expect(resources).toContain('billing');
      expect(resources).toContain('reports');
    });

    it('should return limited resources for therapist', () => {
      const resources = getAccessibleResources('therapist');

      expect(resources).toContain('clients');
      expect(resources).toContain('therapists');
      expect(resources).toContain('appointments');
      expect(resources).toContain('billing');
      expect(resources).toContain('reports');
      expect(resources).not.toContain('users');
      expect(resources).not.toContain('audit_logs');
    });

    it('should return empty array for undefined role', () => {
      const resources = getAccessibleResources(undefined);

      expect(resources).toEqual([]);
    });

    it('should return empty array for invalid role', () => {
      const resources = getAccessibleResources('invalid-role');

      expect(resources).toEqual([]);
    });
  });

  describe('getResourceActions', () => {
    it('should return all CRUD actions for admin on clients', () => {
      const actions = getResourceActions('admin', 'clients');

      expect(actions).toContain('create');
      expect(actions).toContain('read');
      expect(actions).toContain('update');
      expect(actions).toContain('delete');
    });

    it('should return limited actions for therapist on clients', () => {
      const actions = getResourceActions('therapist', 'clients');

      expect(actions).toContain('read');
      expect(actions).toContain('update');
      expect(actions).not.toContain('create');
      expect(actions).not.toContain('delete');
    });

    it('should return empty array for resources without permissions', () => {
      const actions = getResourceActions('therapist', 'users');

      expect(actions).toEqual([]);
    });

    it('should return empty array for undefined role', () => {
      const actions = getResourceActions(undefined, 'clients');

      expect(actions).toEqual([]);
    });
  });

  describe('HIPAA compliance - least privilege principle', () => {
    it('should ensure therapists cannot access audit logs', () => {
      expect(checkPermission('therapist', 'audit_logs', 'read')).toBe(false);
    });

    it('should ensure receptionists cannot access billing', () => {
      expect(checkPermission('receptionist', 'billing', 'read')).toBe(false);
    });

    it('should ensure billing staff cannot modify clients', () => {
      expect(checkPermission('billing', 'clients', 'update')).toBe(false);
      expect(checkPermission('billing', 'clients', 'delete')).toBe(false);
    });

    it('should ensure only admins can manage users', () => {
      expect(checkPermission('admin', 'users', 'create')).toBe(true);
      expect(checkPermission('therapist', 'users', 'create')).toBe(false);
      expect(checkPermission('billing', 'users', 'create')).toBe(false);
      expect(checkPermission('receptionist', 'users', 'create')).toBe(false);
    });

    it('should ensure only admins can access audit logs', () => {
      expect(checkPermission('admin', 'audit_logs', 'read')).toBe(true);
      expect(checkPermission('therapist', 'audit_logs', 'read')).toBe(false);
      expect(checkPermission('billing', 'audit_logs', 'read')).toBe(false);
      expect(checkPermission('receptionist', 'audit_logs', 'read')).toBe(false);
    });
  });

  describe('permission matrix completeness', () => {
    const roles = ['admin', 'therapist', 'billing', 'receptionist'] as const;
    const resources: Resource[] = [
      'clients',
      'therapists',
      'appointments',
      'users',
      'tenants',
      'audit_logs',
      'billing',
      'reports',
    ];
    const actions: Action[] = ['create', 'read', 'update', 'delete'];

    it('should have permissions defined for all role-resource combinations', () => {
      roles.forEach((role) => {
        resources.forEach((resource) => {
          actions.forEach((action) => {
            // Should not throw
            const result = checkPermission(role, resource, action);

            expect(typeof result).toBe('boolean');
          });
        });
      });
    });

    it('should return accessible resources for all valid roles', () => {
      roles.forEach((role) => {
        const accessibleResources = getAccessibleResources(role);

        expect(Array.isArray(accessibleResources)).toBe(true);
      });
    });
  });
});
