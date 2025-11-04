import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import { rescheduleAppointment } from '@/services/appointment.service';
import { RescheduleAppointmentSchema } from '@/validations/appointment.validation';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/appointments/[id]/reschedule
 * Reschedule an appointment to a new time
 */
export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const { tenantId, userId, hasPermission, isAuthenticated }
      = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('appointments', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const params = await context.params;
    const body = await request.json();
    const validatedData = RescheduleAppointmentSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validatedData.error.flatten(),
        },
        { status: 400 },
      );
    }

    const rescheduled = await rescheduleAppointment(
      tenantId,
      userId,
      params.id,
      validatedData.data,
    );

    return NextResponse.json(rescheduled);
  } catch (error) {
    console.error('Error rescheduling appointment:', error);

    if (error instanceof Error) {
      if (error.message === 'Appointment not found') {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
