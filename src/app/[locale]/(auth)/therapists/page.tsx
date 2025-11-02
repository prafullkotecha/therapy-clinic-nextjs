import { redirect } from 'next/navigation';
import { AdminTherapistsView } from '@/components/therapists/AdminTherapistsView';
import { ReceptionistTherapistsView } from '@/components/therapists/ReceptionistTherapistsView';
import { auth } from '@/lib/auth';
import { UserRoles } from '@/lib/rbac';
import { extractPrimaryRole } from '@/lib/role-utils';

/**
 * Therapists page with role-based access control
 * Renders different views based on user role
 */
export default async function TherapistsPage() {
  // Check authentication and role
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  const userRole = extractPrimaryRole(session.user?.roles);

  // Render role-specific view
  switch (userRole) {
    case UserRoles.ADMIN:
      return <AdminTherapistsView />;

    case UserRoles.RECEPTIONIST:
      return <ReceptionistTherapistsView />;

    case UserRoles.THERAPIST:
      // Therapists can view other therapists (for referrals)
      return <ReceptionistTherapistsView />;

    default:
      // Billing role doesn't typically need therapist management
      redirect('/dashboard');
  }
}
