import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  DEFAULT_APPOINTMENT_DURATION_MINUTES,
  MAX_APPOINTMENT_DURATION_MINUTES,
  MIN_APPOINTMENT_DURATION_MINUTES,
} from '@/constants/appointments';
import { getAuthContext } from '@/lib/auth-helpers';
import { getAvailableSlots } from '@/services/appointment.service';

/**
 * GET /api/appointments/available-slots
 * Get available time slots for a therapist on a given date
 * Query params: therapistId, date, duration (optional, default 60)
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

    const { searchParams } = new URL(request.url);
    const therapistId = searchParams.get('therapistId');
    const date = searchParams.get('date');
    const duration = Number.parseInt(
      searchParams.get('duration') || String(DEFAULT_APPOINTMENT_DURATION_MINUTES),
      10,
    );

    if (!therapistId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters: therapistId, date' },
        { status: 400 },
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD' },
        { status: 400 },
      );
    }

    // Validate duration
    if (
      Number.isNaN(duration)
      || duration < MIN_APPOINTMENT_DURATION_MINUTES
      || duration > MAX_APPOINTMENT_DURATION_MINUTES
    ) {
      return NextResponse.json(
        {
          error: `Invalid duration. Must be between ${MIN_APPOINTMENT_DURATION_MINUTES} and ${MAX_APPOINTMENT_DURATION_MINUTES} minutes`,
        },
        { status: 400 },
      );
    }

    const slots = await getAvailableSlots(tenantId, therapistId, date, duration);

    return NextResponse.json(slots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
