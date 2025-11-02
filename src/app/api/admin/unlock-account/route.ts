/**
 * Admin API endpoint for manually unlocking user accounts
 *
 * Only accessible by admin users.
 * Allows administrators to unlock accounts that have been locked due to failed login attempts.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { UserRoles } from '@/lib/rbac';
import { extractPrimaryRole } from '@/lib/role-utils';
import { unlockAccount } from '@/services/lockout.service';

const UnlockAccountSchema = z.object({
  userId: z.string().uuid(),
  tenantId: z.string().uuid(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication and admin role
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    const userRole = extractPrimaryRole(session.user.roles);
    if (userRole !== UserRoles.ADMIN) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Only admins can unlock accounts' },
        { status: 403 },
      );
    }

    // Parse request body
    const body = await request.json();
    const validation = UnlockAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 },
      );
    }

    const { userId, tenantId } = validation.data;

    // Verify tenant matches (prevent cross-tenant operations)
    if (session.user.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'Cannot unlock account in different tenant' },
        { status: 403 },
      );
    }

    // Extract request metadata
    const ipAddress = request.headers.get('x-forwarded-for')
      ?? request.headers.get('x-real-ip')
      ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    // Unlock the account (manual unlock)
    await unlockAccount(tenantId, userId, ipAddress, userAgent, false);

    return NextResponse.json({
      success: true,
      message: 'Account unlocked successfully',
    });
  } catch (error) {
    console.error('Failed to unlock account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
