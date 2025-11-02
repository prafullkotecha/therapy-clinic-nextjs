import { describe, expect, it, vi } from 'vitest';

import { isProtectedRoute, PROTECTED_ROUTES } from './auth-middleware';

// Mock Next.js server modules before importing
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn(),
    redirect: vi.fn(),
  },
}));

vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

describe('auth-middleware', () => {
  describe('isProtectedRoute', () => {
    it('should match admin routes', () => {
      expect(isProtectedRoute('/dashboard/admin', '/dashboard/admin')).toBe(true);
      expect(isProtectedRoute('/dashboard/admin/users', '/dashboard/admin')).toBe(true);
    });

    it('should match therapist routes', () => {
      expect(isProtectedRoute('/dashboard/therapist', '/dashboard/therapist')).toBe(true);
      expect(isProtectedRoute('/dashboard/therapist/clients', '/dashboard/therapist')).toBe(true);
    });

    it('should handle locale prefixes', () => {
      expect(isProtectedRoute('/en/dashboard/admin', '/dashboard/admin')).toBe(true);
      expect(isProtectedRoute('/es/dashboard/therapist', '/dashboard/therapist')).toBe(true);
      expect(isProtectedRoute('/en-US/dashboard/admin', '/dashboard/admin')).toBe(true);
    });

    it('should not match non-protected routes', () => {
      expect(isProtectedRoute('/dashboard', '/dashboard/admin')).toBe(false);
      expect(isProtectedRoute('/sign-in', '/dashboard/admin')).toBe(false);
    });

    it('should not match partial route names', () => {
      expect(isProtectedRoute('/dashboard/admins', '/dashboard/admin')).toBe(false);
    });
  });

  describe('PROTECTED_ROUTES', () => {
    it('should have admin route configured', () => {
      expect(PROTECTED_ROUTES['/dashboard/admin']).toEqual(['admin']);
    });

    it('should have therapist route configured', () => {
      expect(PROTECTED_ROUTES['/dashboard/therapist']).toContain('therapist');
      expect(PROTECTED_ROUTES['/dashboard/therapist']).toContain('admin');
    });

    it('should have billing route configured', () => {
      expect(PROTECTED_ROUTES['/dashboard/billing']).toContain('billing');
      expect(PROTECTED_ROUTES['/dashboard/billing']).toContain('admin');
    });

    it('should have receptionist route configured', () => {
      expect(PROTECTED_ROUTES['/dashboard/receptionist']).toContain('receptionist');
      expect(PROTECTED_ROUTES['/dashboard/receptionist']).toContain('admin');
    });
  });
});
