/**
 * Middleware utilities for Next.js
 * Provides auth and role-based access control for route protection
 */

export {
  autoProtectRoutes,
  isProtectedRoute,
  PROTECTED_ROUTES,
  requireAuth,
  requireAuthWithRole,
  requireRole,
} from './auth-middleware';
