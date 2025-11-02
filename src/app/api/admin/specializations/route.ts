import type { NextRequest } from 'next/server';
import { and, eq, ilike, or } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { specializations } from '@/models/specialization.schema';
import {
  createSpecializationSchema,
  specializationQuerySchema,
} from '@/validations/specialization.validation';

/**
 * GET /api/admin/specializations
 * List all specializations with optional filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('specializations', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = specializationQuerySchema.safeParse(queryParams);

    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedQuery.error.flatten() },
        { status: 400 },
      );
    }

    const { category, isActive, search } = validatedQuery.data;

    // Build query conditions
    const conditions = [eq(specializations.tenantId, tenantId)];

    if (category) {
      conditions.push(eq(specializations.category, category));
    }

    if (isActive !== undefined) {
      conditions.push(eq(specializations.isActive, isActive === 'true'));
    }

    if (search) {
      conditions.push(
        or(
          ilike(specializations.name, `%${search}%`),
          ilike(specializations.description, `%${search}%`),
        )!,
      );
    }

    const result = await withTenantContext(tenantId, async () => {
      return await db
        .select()
        .from(specializations)
        .where(and(...conditions))
        .orderBy(specializations.category, specializations.name);
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching specializations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/specializations
 * Create a new specialization
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('specializations', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createSpecializationSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.flatten() },
        { status: 400 },
      );
    }

    const result = await withTenantContext(tenantId, async () => {
      const [newSpecialization] = await db
        .insert(specializations)
        .values({
          tenantId,
          ...validatedData.data,
        })
        .returning();

      return newSpecialization;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating specialization:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
