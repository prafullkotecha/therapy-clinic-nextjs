import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getTenantContext } from '@/middleware/tenant.middleware';
import { createTenant, getTenantById } from '@/services/tenant.service';

/**
 * GET /api/tenants
 * Get current tenant information
 */
export async function GET(): Promise<NextResponse> {
  try {
    const context = await getTenantContext();

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenant = await getTenantById(context.tenantId);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    console.error('Error fetching tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tenants
 * Create a new tenant (super admin only)
 *
 * IMPORTANT: This endpoint should be restricted to super admins
 * In production, add proper authorization checks
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // TODO: Add super admin authorization check
    const context = await getTenantContext();

    // For now, require authentication but allow any authenticated user
    // In production, check for super admin role
    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 },
      );
    }

    const tenant = await createTenant({
      name: body.name,
      slug: body.slug,
      timezone: body.timezone,
      locale: body.locale,
      plan: body.plan,
      maxLocations: body.maxLocations,
      maxTherapists: body.maxTherapists,
      maxActiveClients: body.maxActiveClients,
      billingEmail: body.billingEmail,
    });

    return NextResponse.json(tenant, { status: 201 });
  } catch (error) {
    console.error('Error creating tenant:', error);

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
