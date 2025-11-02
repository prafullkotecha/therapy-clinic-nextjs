import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-helpers';
import {
  deleteClient,
  getClientById,
  updateClient,
} from '@/services/client.service';
import { updateClientSchema } from '@/validations/client.validation';

/**
 * GET /api/admin/clients/[id]
 * Get a specific client by ID
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { tenantId, userId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('clients', 'read')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const client = await getClientById(tenantId, userId, id);

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);

    if (error instanceof Error && error.message === 'Client not found') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/admin/clients/[id]
 * Update a client profile
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { tenantId, userId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('clients', 'update')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateClientSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validatedData.error.flatten() },
        { status: 400 },
      );
    }

    const updatedClient = await updateClient(
      tenantId,
      userId,
      id,
      validatedData.data,
    );

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);

    if (error instanceof Error) {
      if (error.message === 'Client not found') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/clients/[id]
 * Delete a client profile
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { tenantId, userId, hasPermission, isAuthenticated } = await getAuthContext();

    if (!isAuthenticated || !tenantId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission('clients', 'delete')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteClient(tenantId, userId, id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting client:', error);

    if (error instanceof Error && error.message === 'Client not found') {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
