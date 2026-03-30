import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helpers';
import { createSessionNote, getSessionNotes } from '@/services/session.service';

const sessionQuerySchema = z.object({
  therapistId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const createSessionSchema = z.object({
  locationId: z.string().uuid(),
  appointmentId: z.string().uuid(),
  clientId: z.string().uuid(),
  therapistId: z.string().uuid(),
  sessionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string(),
  endTime: z.string(),
  durationMinutes: z.number().int().positive(),
  sessionType: z.string().min(1),
  units: z.number().int().positive(),
  clientAttendance: z.string().min(1),
  sessionSummary: z.string().optional(),
  clinicalNotes: z.string().optional(),
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, userId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('appointments', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const query = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = sessionQuerySchema.safeParse(query);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: parsed.error.flatten() }, { status: 400 });
    }

    const therapistId = parsed.data.therapistId || userId;
    const notes = await getSessionNotes(tenantId, therapistId, {
      clientId: parsed.data.clientId,
      sessionDate: parsed.data.sessionDate,
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error listing session notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, userId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('appointments', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request data', details: parsed.error.flatten() }, { status: 400 });
    }

    const created = await createSessionNote(tenantId, {
      ...parsed.data,
      startTime: new Date(parsed.data.startTime),
      endTime: new Date(parsed.data.endTime),
      createdBy: userId,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating session note:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
