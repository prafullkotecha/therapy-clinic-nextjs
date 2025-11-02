import type { NextRequest } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { specializations } from '@/models/specialization.schema';
import { updateSpecializationSchema } from '@/validations/specialization.validation';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/admin/specializations/[id]
 * Get a single specialization by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();
    const { id } = await params;

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('specializations', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await withTenantContext(tenantId, async () => {
      const [specialization] = await db
        .select()
        .from(specializations)
        .where(
          and(
            eq(specializations.id, id),
            eq(specializations.tenantId, tenantId),
          ),
        )
        .limit(1);

      return specialization;
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Specialization not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching specialization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/specializations/[id]
 * Update a specialization
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();
    const { id } = await params;

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('specializations', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateSpecializationSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.flatten() },
        { status: 400 },
      );
    }

    const result = await withTenantContext(tenantId, async () => {
      const [updatedSpecialization] = await db
        .update(specializations)
        .set(validatedData.data)
        .where(
          and(
            eq(specializations.id, id),
            eq(specializations.tenantId, tenantId),
          ),
        )
        .returning();

      return updatedSpecialization;
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Specialization not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating specialization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/specializations/[id]
 * Delete a specialization (soft delete by setting isActive = false)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();
    const { id } = await params;

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('specializations', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await withTenantContext(tenantId, async () => {
      // Soft delete: set isActive to false
      const [deletedSpecialization] = await db
        .update(specializations)
        .set({ isActive: false })
        .where(
          and(
            eq(specializations.id, id),
            eq(specializations.tenantId, tenantId),
          ),
        )
        .returning();

      return deletedSpecialization;
    });

    if (!result) {
      return NextResponse.json(
        { error: 'Specialization not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error deleting specialization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
