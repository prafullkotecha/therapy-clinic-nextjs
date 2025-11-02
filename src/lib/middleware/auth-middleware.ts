import type { NextRequest } from 'next/server';
import type { UserRole } from '@/lib/rbac';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserRoles } from '@/lib/rbac';
import { extractPrimaryRole } from '@/lib/role-utils';

/**
 * Middleware to require authentication
 * Redirects to sign-in if not authenticated
 *
 * @param request - Next.js request object
 * @returns Response or null to continue
 *
 * @example
 * ```ts
 * // In middleware.ts or route-specific middleware
 * export async function middleware(request: NextRequest) {
 *   const authResponse = await requireAuth(request);
 *   if (authResponse) return authResponse;
 *   // Continue processing...
 * }
 * ```
 */
export async function requireAuth(
  request: NextRequest,
): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) {
    const locale = request.nextUrl.pathname.match(/^\/([^/]+)/)?.at(1) ?? '';
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set(
      'callbackUrl',
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(signInUrl);
  }

  return null;
}

/**
 * Middleware to require specific roles
 * Returns 403 Forbidden if user doesn't have required role
 *
 * @param request - Next.js request object
 * @param allowedRoles - Array of roles that are allowed to access
 * @returns Response or null to continue
 *
 * @example
 * ```ts
 * // Protect admin routes
 * export async function middleware(request: NextRequest) {
 *   const authResponse = await requireAuth(request);
 *   if (authResponse) return authResponse;
 *
 *   const roleResponse = await requireRole(request, ['admin']);
 *   if (roleResponse) return roleResponse;
 *
 *   // User is authenticated and has admin role
 * }
 * ```
 *
 * @example
 * ```ts
 * // Allow multiple roles
 * const roleResponse = await requireRole(request, ['admin', 'therapist']);
 * ```
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[],
): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) {
    // This should not happen if requireAuth was called first
    const locale = request.nextUrl.pathname.match(/^\/([^/]+)/)?.at(1) ?? '';
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    return NextResponse.redirect(signInUrl);
  }

  const userRole = extractPrimaryRole(session.user.roles);

  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      {
        error: 'Forbidden',
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      },
      { status: 403 },
    );
  }

  return null;
}

/**
 * Helper to check if pathname matches a protected route pattern
 *
 * @param pathname - Request pathname
 * @param pattern - Route pattern (e.g., '/admin', '/therapist')
 * @returns true if pathname matches pattern
 */
export function isProtectedRoute(pathname: string, pattern: string): boolean {
  // Handle locale prefix (e.g., /en/admin, /es/admin)
  // Only strip locale if it exists, otherwise use pathname as-is
  const localeMatch = pathname.match(/^\/[a-z]{2}(-[A-Z]{2})?\//);
  const pathWithoutLocale = localeMatch ? pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') : pathname;

  // Check if path starts with pattern and is followed by '/' or end of string
  // This prevents '/dashboard/admins' from matching '/dashboard/admin'
  return (
    pathWithoutLocale === pattern
    || pathWithoutLocale.startsWith(`${pattern}/`)
  );
}

/**
 * Combined middleware for auth + role protection
 * Convenience function that combines requireAuth and requireRole
 *
 * @param request - Next.js request object
 * @param allowedRoles - Array of roles that are allowed to access
 * @returns Response or null to continue
 *
 * @example
 * ```ts
 * export async function middleware(request: NextRequest) {
 *   // Single call handles both auth and role check
 *   const response = await requireAuthWithRole(request, ['admin']);
 *   if (response) return response;
 *
 *   // User is authenticated and has admin role
 * }
 * ```
 */
export async function requireAuthWithRole(
  request: NextRequest,
  allowedRoles: UserRole[],
): Promise<NextResponse | null> {
  // First check authentication
  const authResponse = await requireAuth(request);
  if (authResponse) {
    return authResponse;
  }

  // Then check role
  const roleResponse = await requireRole(request, allowedRoles);
  if (roleResponse) {
    return roleResponse;
  }

  return null;
}

/**
 * Role-based route matcher
 * Maps route patterns to required roles
 */
export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/dashboard/admin': [UserRoles.ADMIN],
  '/dashboard/therapist': [UserRoles.THERAPIST, UserRoles.ADMIN],
  '/dashboard/billing': [UserRoles.BILLING, UserRoles.ADMIN],
  '/dashboard/receptionist': [UserRoles.RECEPTIONIST, UserRoles.ADMIN],
} as const;

/**
 * Automatic route protection based on PROTECTED_ROUTES config
 * Checks pathname against configured routes and enforces role requirements
 *
 * @param request - Next.js request object
 * @returns Response or null to continue
 *
 * @example
 * ```ts
 * // In middleware.ts
 * export async function middleware(request: NextRequest) {
 *   const response = await autoProtectRoutes(request);
 *   if (response) return response;
 *   // Continue with other middleware...
 * }
 * ```
 */
export async function autoProtectRoutes(
  request: NextRequest,
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;

  // Check each protected route
  for (const [routePattern, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (isProtectedRoute(pathname, routePattern)) {
      return requireAuthWithRole(request, allowedRoles);
    }
  }

  return null;
}
