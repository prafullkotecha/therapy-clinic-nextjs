import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import {
  createTherapist,
  listTherapists,
} from '@/services/therapist.service';
import {
  createTherapistSchema,
  therapistQuerySchema,
} from '@/validations/therapist.validation';

/**
 * GET /api/admin/therapists
 * List all therapists with optional filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('therapists', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = therapistQuerySchema.safeParse(queryParams);

    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedQuery.error.flatten() },
        { status: 400 },
      );
    }

    const therapistsList = await listTherapists(tenantId, validatedQuery.data);

    return NextResponse.json(therapistsList);
  } catch (error) {
    console.error('Error fetching therapists:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/therapists
 * Create a new therapist profile
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('therapists', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createTherapistSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.flatten() },
        { status: 400 },
      );
    }

    const newTherapist = await createTherapist(tenantId, validatedData.data);

    return NextResponse.json(newTherapist, { status: 201 });
  } catch (error) {
    console.error('Error creating therapist:', error);

    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      if (error.message === 'Therapist profile already exists for this user') {
        return NextResponse.json(
          { error: 'Therapist profile already exists for this user' },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
