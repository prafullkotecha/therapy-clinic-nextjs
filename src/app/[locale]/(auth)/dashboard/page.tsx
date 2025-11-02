import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminDashboard } from '@/components/dashboards/AdminDashboard';
import { BillingDashboard } from '@/components/dashboards/BillingDashboard';
import { ReceptionistDashboard } from '@/components/dashboards/ReceptionistDashboard';
import { TherapistDashboard } from '@/components/dashboards/TherapistDashboard';
import { auth } from '@/lib/auth';
import { UserRoles } from '@/lib/rbac';

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
  const userRole = session?.user?.roles?.[0] || UserRoles.THERAPIST;

  // Render role-specific dashboard
  switch (userRole) {
    case UserRoles.ADMIN:
      return <AdminDashboard />;
    case UserRoles.THERAPIST:
      return <TherapistDashboard />;
    case UserRoles.BILLING:
      return <BillingDashboard />;
    case UserRoles.RECEPTIONIST:
      return <ReceptionistDashboard />;
    default:
      return <TherapistDashboard />;
  }
}
