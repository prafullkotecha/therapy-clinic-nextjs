/**
 * Cron job endpoint for auto-unlocking accounts
 *
 * Should be called periodically (e.g., every 5 minutes) by a cron service.
 * Unlocks accounts that have been locked for longer than the lockout duration.
 *
 * For production, this can be triggered by:
 * - Vercel Cron (vercel.json configuration)
 * - AWS EventBridge (scheduled Lambda)
 * - External cron service (e.g., cron-job.org)
 *
 * Security: Protect this endpoint with a secret token
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { autoUnlockExpiredAccounts, cleanupExpiredAttempts } from '@/services/lockout.service';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Auto-unlock expired accounts
    const unlockedCount = await autoUnlockExpiredAccounts();

    // Cleanup expired failed login attempts
    const cleanedCount = await cleanupExpiredAttempts();

    // Use console.warn for cron job output (allowed by eslint config)
    console.warn(`Auto-unlock cron: Unlocked ${unlockedCount} accounts, cleaned ${cleanedCount} expired attempts`);

    return NextResponse.json({
      success: true,
      unlockedCount,
      cleanedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to run auto-unlock cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Support POST as well for flexibility with different cron services
export const POST = GET;
