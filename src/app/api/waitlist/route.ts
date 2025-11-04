import type { NextRequest } from 'next/server';
import { asc, desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { waitlist } from '@/models/appointment.schema';
import { addToWaitlist } from '@/services/appointment.service';
import { WaitlistSchema } from '@/validations/appointment.validation';

/**
 * GET /api/waitlist
 * List all waitlist entries
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, userId, hasPermission, isAuthenticated }
      = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('appointments', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Defense-in-depth: Explicit tenant filter supplements RLS policy
    // This pattern is used throughout the codebase (see appointment.service.ts)
    // Provides extra safety if RLS policies are misconfigured or disabled
    const waitlistEntries = await withTenantContext(tenantId, async () => {
      return db
        .select()
        .from(waitlist)
        .where(eq(waitlist.tenantId, tenantId))
        .orderBy(desc(waitlist.priority), asc(waitlist.addedAt));
    });

    return NextResponse.json(waitlistEntries);
  } catch (error) {
    console.error('Error fetching waitlist:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/waitlist
 * Add a client to the waitlist
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, userId, hasPermission, isAuthenticated }
      = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('appointments', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = WaitlistSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validatedData.error.flatten(),
        },
        { status: 400 },
      );
    }

    const newEntry = await addToWaitlist(
      tenantId,
      validatedData.data.clientId,
      validatedData.data.therapistId,
      validatedData.data.preferredDates,
      validatedData.data.preferredTimes,
      validatedData.data.priority,
    );

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error adding to waitlist:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
