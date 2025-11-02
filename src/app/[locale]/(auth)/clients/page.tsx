import { redirect } from 'next/navigation';
import { ClientsPageContent } from '@/components/clients/ClientsPageContent';
import { auth } from '@/lib/auth';
import { UserRoles } from '@/lib/rbac';
import { extractPrimaryRole } from '@/lib/role-utils';

/**
 * Clients page with role-based access control
 * Currently admin-only, will add other role views in issue #72
 */
export default async function ClientsPage() {
  // Check authentication and role
  const session = await auth();
  const userRole = extractPrimaryRole(session?.user?.roles);

  // For now, only admins can access (will add other roles in issue #72)
  if (userRole !== UserRoles.ADMIN) {
    redirect('/dashboard');
  }

  // Render admin clients view
  return <ClientsPageContent />;
}
