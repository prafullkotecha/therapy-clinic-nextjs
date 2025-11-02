import type { UserRole } from '@/lib/rbac';
import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { auth } from '@/lib/auth';
import { UserRoles } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);

  // Check authentication
  const session = await auth();
  if (!session?.user) {
    redirect(`/${locale}/sign-in`);
  }

  // Extract user role from session (assumes Keycloak JWT contains roles)
  const userRole = (session.user.roles?.[0] || UserRoles.THERAPIST) as UserRole;
  const userName = session.user.name || 'User';
  const userEmail = session.user.email || '';

  return (
    <DashboardShell
      userRole={userRole}
      userName={userName}
      userEmail={userEmail}
    >
      {props.children}
    </DashboardShell>
  );
}
