import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { BillingDashboard } from '@/components/dashboards/BillingDashboard';
import { ReceptionistDashboard } from '@/components/dashboards/ReceptionistDashboard';
import { TherapistDashboard } from '@/components/dashboards/TherapistDashboard';
import { auth } from '@/lib/auth';
import { UserRoles } from '@/lib/rbac';
import { extractPrimaryRole } from '@/lib/role-utils';
import { getDashboardStats } from '@/services/dashboard.service';

export const dynamic = 'force-dynamic';

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'Dashboard',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const userRole = extractPrimaryRole(session?.user?.roles);
  const stats = session?.user?.tenantId && session?.user?.id
    ? await getDashboardStats(
        session.user.tenantId,
        session.user.id,
        userRole,
      )
    : {
        totalClients: 0,
        todaysAppointments: 0,
        assignedClients: 0,
        recentActivity: [],
      };

  // Render role-specific dashboard
  switch (userRole) {
    case UserRoles.ADMIN:
      return <AdminDashboard stats={stats} />;
    case UserRoles.THERAPIST:
      return <TherapistDashboard stats={stats} />;
    case UserRoles.BILLING:
      return <BillingDashboard stats={stats} />;
    case UserRoles.RECEPTIONIST:
      return <ReceptionistDashboard stats={stats} />;
    default:
      return <TherapistDashboard stats={stats} />;
  }
}
