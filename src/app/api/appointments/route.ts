import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import {
  createAppointment,
  getAppointments,
} from '@/services/appointment.service';
import {
  AppointmentQueryParamsSchema,
  CreateAppointmentSchema,
} from '@/validations/appointment.validation';

/**
 * GET /api/appointments
 * List appointments with optional filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, userId, hasPermission, isAuthenticated }
      = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('appointments', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);

    const validatedQuery = AppointmentQueryParamsSchema.safeParse(queryParams);

    if (!validatedQuery.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validatedQuery.error.flatten(),
        },
        { status: 400 },
      );
    }

    const appointments = await getAppointments(
      tenantId,
      userId,
      validatedQuery.data,
    );

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/appointments
 * Create a new appointment
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
    const validatedData = CreateAppointmentSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validatedData.error.flatten(),
        },
        { status: 400 },
      );
    }

    const newAppointment = await createAppointment(
      tenantId,
      userId,
      validatedData.data,
    );

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
