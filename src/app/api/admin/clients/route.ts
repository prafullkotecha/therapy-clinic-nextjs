import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import {
  createClient,
  listClients,
} from '@/services/client.service';
import {
  clientQuerySchema,
  createClientSchema,
} from '@/validations/client.validation';

/**
 * GET /api/admin/clients
 * List all clients with optional filtering
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, userId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('clients', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = clientQuerySchema.safeParse(queryParams);

    if (!validatedQuery.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validatedQuery.error.flatten() },
        { status: 400 },
      );
    }

    const clientsList = await listClients(tenantId, userId, validatedQuery.data);

    return NextResponse.json(clientsList);
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/clients
 * Create a new client profile
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { tenantId, userId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('clients', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createClientSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.flatten() },
        { status: 400 },
      );
    }

    const newClient = await createClient(tenantId, userId, validatedData.data);

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error('Error creating client:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
