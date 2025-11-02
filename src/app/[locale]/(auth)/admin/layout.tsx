import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { auth } from '@/lib/auth';
import { UserRoles } from '@/lib/rbac';
import { extractPrimaryRole } from '@/lib/role-utils';

export const dynamic = 'force-dynamic';

export default async function AdminLayout(props: {
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

  // Extract user role and verify admin access
  const userRole = extractPrimaryRole(session.user.roles);

  // Only admins can access admin routes
  if (userRole !== UserRoles.ADMIN) {
    redirect(`/${locale}/dashboard`);
  }

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
