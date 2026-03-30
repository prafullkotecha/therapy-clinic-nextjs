import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthContext } from '@/lib/auth-helpers';
import { getSessionNote, updateSessionNote } from '@/services/session.service';

type RouteContext = { params: Promise<{ id: string }> };

const updateSessionSchema = z.object({
  clientAttendance: z.string().min(1).optional(),
  sessionSummary: z.string().optional(),
  clinicalNotes: z.string().optional(),
});

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('appointments', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await context.params;
    const note = await getSessionNote(tenantId, id);

    if (!note) {
      return NextResponse.json({ error: 'Session note not found' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching session note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('appointments', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request data', details: parsed.error.flatten() }, { status: 400 });
    }

    const { id } = await context.params;
    const updated = await updateSessionNote(tenantId, id, parsed.data);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating session note:', error);
    if (error instanceof Error && error.message === 'Session note not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
