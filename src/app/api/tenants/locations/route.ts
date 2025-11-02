import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getTenantContext } from '@/middleware/tenant.middleware';
import { createLocation, getLocations } from '@/services/tenant.service';

/**
 * GET /api/tenants/locations
 * Get all locations for the current tenant
 */
export async function GET(): Promise<NextResponse> {
  try {
    const context = await getTenantContext();

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const locations = await getLocations(context.tenantId);

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/tenants/locations
 * Create a new location for the current tenant
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const context = await getTenantContext();

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    if (context.userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Location name is required' },
        { status: 400 },
      );
    }

    const location = await createLocation(context.tenantId, {
      name: body.name,
      address: body.address,
      city: body.city,
      state: body.state,
      zipCode: body.zipCode,
      phone: body.phone,
      email: body.email,
      isPrimary: body.isPrimary,
    });

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
