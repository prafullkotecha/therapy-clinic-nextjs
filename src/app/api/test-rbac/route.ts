import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = session.user.roles?.[0];

  const permissions = {
    role,
    email: session.user.email,
    // Client permissions
    canReadClients: checkPermission(role, 'clients', 'read'),
    canCreateClients: checkPermission(role, 'clients', 'create'),
    canUpdateClients: checkPermission(role, 'clients', 'update'),
    canDeleteClients: checkPermission(role, 'clients', 'delete'),
    // Audit & admin permissions
    canReadAuditLogs: checkPermission(role, 'audit_logs', 'read'),
    canCreateUsers: checkPermission(role, 'users', 'create'),
    canDeleteUsers: checkPermission(role, 'users', 'delete'),
    // Billing permissions
    canReadBilling: checkPermission(role, 'billing', 'read'),
    canManageBilling: checkPermission(role, 'billing', 'update'),
    // Appointment permissions
    canCreateAppointments: checkPermission(role, 'appointments', 'create'),
    canDeleteAppointments: checkPermission(role, 'appointments', 'delete'),
  };

  return NextResponse.json(permissions);
}
