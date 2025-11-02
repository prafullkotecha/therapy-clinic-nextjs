import { requireAuth } from '@/lib/auth-helpers';

export default async function TherapistDashboardPage() {
  // Server-side auth check (also protected by middleware)
  const session = await requireAuth();

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-4 text-3xl font-bold">Therapist Dashboard</h1>
      <div className="rounded-lg bg-green-50 p-6">
        <p className="text-lg">
          Welcome,
          {session.user.name}
          !
        </p>
        <p className="mt-2 text-gray-600">
          Role:
          {' '}
          <span className="font-semibold">{session.user.roles.join(', ')}</span>
        </p>
        <p className="mt-2 text-gray-600">
          Tenant ID:
          {' '}
          <span className="font-mono text-sm">{session.user.tenantId}</span>
        </p>
        <div className="mt-4">
          <p className="font-semibold text-green-600">
            ✓ This page is protected by role-based middleware
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Users with 'therapist' or 'admin' roles can access this page.
            Attempting to access without proper role will result in 403 Forbidden.
          </p>
        </div>
      </div>
    </div>
  );
}
