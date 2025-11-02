import { redirect } from 'next/navigation';
import { AdminClientsView } from '@/components/clients/AdminClientsView';
import { BillingClientsView } from '@/components/clients/BillingClientsView';
import { ReceptionistClientsView } from '@/components/clients/ReceptionistClientsView';
import { TherapistClientsView } from '@/components/clients/TherapistClientsView';
import { auth } from '@/lib/auth';
import { UserRoles } from '@/lib/rbac';
import { extractPrimaryRole } from '@/lib/role-utils';

/**
 * Clients page with role-based access control
 * Renders different views based on user role
 */
export default async function ClientsPage() {
  // Check authentication and role
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  const userRole = extractPrimaryRole(session.user?.roles);
  const userId = session.user?.id || '';

  // Render role-specific view
  switch (userRole) {
    case UserRoles.ADMIN:
      return <AdminClientsView />;

    case UserRoles.THERAPIST:
      return <TherapistClientsView userId={userId} />;

    case UserRoles.BILLING:
      return <BillingClientsView />;

    case UserRoles.RECEPTIONIST:
      return <ReceptionistClientsView />;

    default:
      redirect('/dashboard');
  }
}
