import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import { createRecurringAppointments } from '@/services/appointment.service';
import { RecurringAppointmentSchema } from '@/validations/appointment.validation';

/**
 * POST /api/appointments/recurring
 * Create recurring appointments based on a recurrence pattern
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
    const validatedData = RecurringAppointmentSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validatedData.error.flatten(),
        },
        { status: 400 },
      );
    }

    const createdAppointments = await createRecurringAppointments(
      tenantId,
      userId,
      validatedData.data,
    );

    return NextResponse.json(
      {
        message: 'Recurring appointments created',
        count: createdAppointments.length,
        appointments: createdAppointments,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating recurring appointments:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
