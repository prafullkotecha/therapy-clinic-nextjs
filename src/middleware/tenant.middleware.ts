import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { setTenantContext } from '@/lib/tenant-db';

/**
 * Tenant middleware - Extracts tenant context from JWT and sets it for RLS
 *
 * This middleware:
 * 1. Extracts the tenant ID from the Keycloak JWT token
 * 2. Sets the PostgreSQL session variable for Row-Level Security
 * 3. Attaches tenant info to the request for downstream use
 *
 * HIPAA Compliance: Ensures tenant isolation at the database level
 */

export type TenantContext = {
  tenantId: string;
  userId: string;
  userRole: string;
  userEmail: string;
};

/**
 * Extract tenant context from the authenticated session
 * @returns TenantContext or null if not authenticated
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const tenantId = (session.user as any).tenantId;
  const userId = session.user.id;
  const userEmail = session.user.email;
  const roles = (session.user as any).roles || [];
  const userRole = roles[0] || 'user'; // Primary role

  if (!tenantId) {
    throw new Error('Tenant ID not found in session');
  }

  return {
    tenantId,
    userId: userId || '',
    userRole,
    userEmail: userEmail || '',
  };
}

/**
 * Middleware to inject tenant context into requests
 * Call this in API routes before database operations
 */
export async function withTenantMiddleware(
  request: NextRequest,
  handler: (
    req: NextRequest,
    context: TenantContext,
  ) => Promise<NextResponse> | NextResponse,
): Promise<NextResponse> {
  const tenantContext = await getTenantContext();

  if (!tenantContext) {
    return NextResponse.json(
      { error: 'Unauthorized - No tenant context' },
      { status: 401 },
    );
  }

  // Set the tenant context for RLS
  await setTenantContext(tenantContext.tenantId);

  // Call the handler with request and context
  return handler(request, tenantContext);
}

/**
 * Helper to extract tenant ID from session (for client components)
 * @returns Promise<string | null>
 */
export async function getCurrentTenantId(): Promise<string | null> {
  const context = await getTenantContext();
  return context?.tenantId || null;
}
