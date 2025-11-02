import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientAuthExample } from '@/components/auth/ClientAuthExample';
import {
  checkUserPermission,
  getAuthContext,
  getServerSession,
  requireAuth,
} from '@/lib/auth-helpers';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  });

  return {
    title: `${t('meta_title')} - Auth Test`,
  };
}

/**
 * Server component demonstrating server-side auth helper usage
 */
export default async function AuthTestPage() {
  // Example 1: Get session (may be null)
  const session = await getServerSession();

  // Example 2: Require auth (redirects if not authenticated)
  const authSession = await requireAuth();

  // Example 3: Check permission
  const canReadClients = await checkUserPermission('clients', 'read');

  // Example 4: Get full auth context
  const authContext = await getAuthContext();

  return (
    <div className="space-y-8 p-8">
      <h1 className="text-3xl font-bold">Auth Hooks Test Page</h1>

      <div className="rounded border p-6">
        <h2 className="mb-4 text-2xl font-semibold">Server-Side Auth Helpers</h2>

        <div className="space-y-4">
          <div className="rounded bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">getServerSession()</h3>
            <pre className="overflow-auto text-sm">
              {JSON.stringify(
                {
                  authenticated: !!session,
                  user: session?.user?.name,
                  role: authContext.userRole,
                  tenantId: session?.user?.tenantId,
                },
                null,
                2,
              )}
            </pre>
          </div>

          <div className="rounded bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">requireAuth()</h3>
            <p className="text-sm">
              ✅ Successfully authenticated (would redirect otherwise)
            </p>
            <p className="text-sm">
              User:
              {authSession.user.name}
            </p>
          </div>

          <div className="rounded bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">checkUserPermission('clients', 'read')</h3>
            <p className="text-sm">
              Result:
              {' '}
              {canReadClients ? '✅ Allowed' : '❌ Denied'}
            </p>
          </div>

          <div className="rounded bg-gray-50 p-4">
            <h3 className="mb-2 font-semibold">getAuthContext()</h3>
            <pre className="overflow-auto text-sm">
              {JSON.stringify(
                {
                  userId: authContext.userId,
                  tenantId: authContext.tenantId,
                  userRole: authContext.userRole,
                  userRoles: authContext.userRoles,
                  isAuthenticated: authContext.isAuthenticated,
                  canReadClients: authContext.hasPermission('clients', 'read'),
                  canCreateAppointments: authContext.hasPermission('appointments', 'create'),
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </div>

      <div className="rounded border p-6">
        <h2 className="mb-4 text-2xl font-semibold">Client-Side Auth Hooks</h2>
        <ClientAuthExample />
      </div>
    </div>
  );
}
