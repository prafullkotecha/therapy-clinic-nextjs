import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import {
  deleteTherapist,
  getTherapistById,
  updateTherapist,
} from '@/services/therapist.service';
import { updateTherapistSchema } from '@/validations/therapist.validation';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/admin/therapists/[id]
 * Get a specific therapist by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('therapists', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const therapist = await getTherapistById(tenantId, id);

    return NextResponse.json(therapist);
  } catch (error) {
    console.error('Error fetching therapist:', error);

    if (error instanceof Error && error.message === 'Therapist not found') {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/therapists/[id]
 * Update a therapist profile
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('therapists', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateTherapistSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.flatten() },
        { status: 400 },
      );
    }

    const updatedTherapist = await updateTherapist(tenantId, id, validatedData.data);

    return NextResponse.json(updatedTherapist);
  } catch (error) {
    console.error('Error updating therapist:', error);

    if (error instanceof Error && error.message === 'Therapist not found') {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/therapists/[id]
 * Delete a therapist profile
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('therapists', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    await deleteTherapist(tenantId, id);

    return NextResponse.json({ message: 'Therapist deleted successfully' });
  } catch (error) {
    console.error('Error deleting therapist:', error);

    if (error instanceof Error && error.message === 'Therapist not found') {
      return NextResponse.json({ error: 'Therapist not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
