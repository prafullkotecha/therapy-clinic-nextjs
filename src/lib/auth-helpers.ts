import type { Action, Resource } from './rbac';
import { redirect } from 'next/navigation';
import { auth } from './auth';
import { checkPermission, checkResourcePermission } from './rbac';
import { extractPrimaryRole } from './role-utils';

export type ServerSession = {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles: string[];
    tenantId: string;
  };
  accessToken: string;
  idToken: string;
};

/**
 * Get current session in server components/route handlers
 * Returns null if not authenticated
 *
 * @example Server Component
 * ```tsx
 * export default async function Page() {
 *   const session = await getServerSession();
 *
 *   if (!session) {
 *     return <SignInPrompt />;
 *   }
 *
 *   return <div>Welcome {session.user.name}</div>;
 * }
 * ```
 *
 * @example Route Handler
 * ```tsx
 * export async function GET() {
 *   const session = await getServerSession();
 *   if (!session) {
 *     return new Response('Unauthorized', { status: 401 });
 *   }
 *   // ... handle request
 * }
 * ```
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  return {
    user: {
      id: session.user.id || '',
      name: session.user.name,
      email: session.user.email,
      image: session.user.image,
      roles: session.user.roles || [],
      tenantId: session.user.tenantId || '',
    },
    accessToken: session.accessToken || '',
    idToken: session.idToken || '',
  };
}

/**
 * Get current session or redirect to sign-in
 * Use this in protected server components
 *
 * @param redirectUrl - Optional URL to redirect to after sign-in
 * @returns Session (never null - redirects if unauthenticated)
 *
 * @example
 * ```tsx
 * export default async function ProtectedPage() {
 *   const session = await requireAuth();
 *   // session is guaranteed to exist here
 *   return <div>Welcome {session.user.name}</div>;
 * }
 * ```
 */
export async function requireAuth(redirectUrl?: string): Promise<ServerSession> {
  const session = await getServerSession();

  if (!session) {
    const signInUrl = redirectUrl
      ? `/sign-in?callbackUrl=${encodeURIComponent(redirectUrl)}`
      : '/sign-in';
    redirect(signInUrl);
  }

  return session;
}

/**
 * Require specific permission or redirect/throw
 * Use in server components/route handlers that need authorization
 *
 * @param resource - Resource being accessed
 * @param action - Action being performed
 * @param options - Options for handling unauthorized access
 * @param options.redirectTo - Redirect to this URL if unauthorized (server components)
 * @param options.throwError - Throw error instead of redirecting (route handlers)
 * @returns Session if authorized
 *
 * @example Server Component
 * ```tsx
 * export default async function ClientsPage() {
 *   const session = await requirePermission('clients', 'read', {
 *     redirectTo: '/dashboard',
 *   });
 *   // User is guaranteed to have 'clients:read' permission
 *   return <ClientsList />;
 * }
 * ```
 *
 * @example Route Handler
 * ```tsx
 * export async function POST() {
 *   const session = await requirePermission('clients', 'create', {
 *     throwError: true,
 *   });
 *   // User is guaranteed to have 'clients:create' permission
 * }
 * ```
 */
export async function requirePermission(
  resource: Resource,
  action: Action,
  options: {
    /** Redirect to this URL if unauthorized (server components) */
    redirectTo?: string;
    /** Throw error instead of redirecting (route handlers) */
    throwError?: boolean;
  } = {},
): Promise<ServerSession> {
  const session = await requireAuth();

  const userRole = extractPrimaryRole(session.user.roles);
  const hasPermission = checkPermission(userRole, resource, action);

  if (!hasPermission) {
    if (options.throwError) {
      throw new Error(`Forbidden: Missing permission ${resource}:${action}`);
    }

    const redirectUrl = options.redirectTo || '/dashboard';
    redirect(redirectUrl);
  }

  return session;
}

/**
 * Check if current user has permission (returns boolean)
 * Use when you need conditional rendering without redirecting
 *
 * @param resource - Resource being accessed
 * @param action - Action being performed
 * @returns true if user has permission, false otherwise
 *
 * @example
 * ```tsx
 * export default async function Page() {
 *   const session = await requireAuth();
 *   const canCreateClients = await checkUserPermission('clients', 'create');
 *
 *   return (
 *     <div>
 *       {canCreateClients && <CreateClientButton />}
 *     </div>
 *   );
 * }
 * ```
 */
export async function checkUserPermission(
  resource: Resource,
  action: Action,
): Promise<boolean> {
  const session = await getServerSession();

  if (!session) {
    return false;
  }

  const userRole = extractPrimaryRole(session.user.roles);
  return checkPermission(userRole, resource, action);
}

/**
 * Check if user can access specific resource instance (ownership check)
 *
 * @param resource - Resource being accessed
 * @param action - Action being performed
 * @param resourceOwnerId - ID of resource owner (e.g., therapist ID)
 * @returns true if user can access, false otherwise
 *
 * @example
 * ```tsx
 * export default async function ClientPage({ params }: { params: { id: string } }) {
 *   const session = await requireAuth();
 *   const client = await getClient(params.id);
 *
 *   const canAccess = await checkResourceAccess(
 *     'clients',
 *     'update',
 *     client.therapistId,
 *   );
 *
 *   if (!canAccess) {
 *     redirect('/dashboard');
 *   }
 *
 *   return <EditClientForm client={client} />;
 * }
 * ```
 */
export async function checkResourceAccess(
  resource: Resource,
  action: Action,
  resourceOwnerId: string | null,
): Promise<boolean> {
  const session = await getServerSession();

  if (!session) {
    return false;
  }

  const userRole = extractPrimaryRole(session.user.roles);
  const userId = session.user.id;

  return checkResourcePermission(userRole, resource, action, resourceOwnerId, userId);
}

/**
 * Get session and extract common auth properties
 * Convenience helper for route handlers and server components
 *
 * @returns Auth context with userId, tenantId, role, etc.
 *
 * @example Route Handler
 * ```tsx
 * export async function GET() {
 *   const { userId, tenantId, userRole, hasPermission } = await getAuthContext();
 *
 *   if (!hasPermission('clients', 'read')) {
 *     return new Response('Forbidden', { status: 403 });
 *   }
 *
 *   const clients = await getClients(tenantId);
 *   return Response.json(clients);
 * }
 * ```
 */
export async function getAuthContext() {
  const session = await getServerSession();

  if (!session) {
    return {
      session: null,
      userId: null,
      tenantId: null,
      userRole: null,
      userRoles: [],
      accessToken: null,
      idToken: null,
      isAuthenticated: false,
      hasPermission: (_resource: Resource, _action: Action) => false,
      canAccessResource: (
        _resource: Resource,
        _action: Action,
        _resourceOwnerId: string | null,
      ) => false,
    };
  }

  const userId = session.user.id;
  const tenantId = session.user.tenantId;
  const userRoles = session.user.roles;
  const userRole = extractPrimaryRole(userRoles);
  const accessToken = session.accessToken;
  const idToken = session.idToken;

  const hasPermission = (resource: Resource, action: Action): boolean => {
    return checkPermission(userRole, resource, action);
  };

  const canAccessResource = (
    resource: Resource,
    action: Action,
    resourceOwnerId: string | null,
  ): boolean => {
    return checkResourcePermission(userRole, resource, action, resourceOwnerId, userId);
  };

  return {
    session,
    userId,
    tenantId,
    userRole,
    userRoles,
    accessToken,
    idToken,
    isAuthenticated: true,
    hasPermission,
    canAccessResource,
  };
}
