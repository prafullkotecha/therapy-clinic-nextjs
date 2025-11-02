/**
 * API endpoint for recording failed login attempts
 *
 * This is called by the sign-in page when Keycloak authentication fails.
 * It tracks failed attempts and locks accounts after threshold is exceeded.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logLoginFailed } from '@/services/audit.service';
import { checkAndLockAccount, recordFailedLoginAttempt } from '@/services/lockout.service';

const FailedLoginSchema = z.object({
  tenantId: z.string().uuid(),
  identifier: z.string().email(),
  failureReason: z.string().optional(),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json();
    const validation = FailedLoginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 },
      );
    }

    const { tenantId, identifier, failureReason } = validation.data;

    // Extract request metadata
    const ipAddress = request.headers.get('x-forwarded-for')
      ?? request.headers.get('x-real-ip')
      ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    // Record the failed attempt
    await recordFailedLoginAttempt(
      tenantId,
      identifier,
      'email',
      ipAddress,
      userAgent,
      failureReason,
    );

    // Log the failed login to audit logs
    await logLoginFailed(
      tenantId,
      identifier,
      ipAddress,
      userAgent,
      failureReason,
    );

    // Check if account should be locked
    const wasLocked = await checkAndLockAccount(
      tenantId,
      identifier,
      ipAddress,
      userAgent,
    );

    return NextResponse.json({
      success: true,
      accountLocked: wasLocked,
    });
  } catch (error) {
    console.error('Failed to record failed login attempt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
