import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { waitlist } from '@/models/appointment.schema';

/**
 * POST /api/waitlist/[id]/reject
 * Reject a waitlist notification and return to waiting status
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { tenantId, userId, hasPermission, isAuthenticated }
      = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('appointments', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Get the waitlist entry
    const entry = await withTenantContext(tenantId, async () => {
      const [waitlistEntry] = await db
        .select()
        .from(waitlist)
        .where(
          and(
            eq(waitlist.tenantId, tenantId),
            eq(waitlist.id, id),
            eq(waitlist.status, 'notified'),
          ),
        );

      return waitlistEntry;
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Waitlist entry not found or already processed' },
        { status: 404 },
      );
    }

    // Return to waiting status
    await withTenantContext(tenantId, async () => {
      await db
        .update(waitlist)
        .set({
          status: 'waiting',
          notifiedAt: null,
        })
        .where(eq(waitlist.id, id));
    });

    logger.info(`Client ${entry.clientId} rejected waitlist notification ${id}`);

    return NextResponse.json({
      success: true,
      message: 'Waitlist notification rejected, returned to waiting status',
      waitlistId: id,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error rejecting waitlist notification:', { error: errorMessage });

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
