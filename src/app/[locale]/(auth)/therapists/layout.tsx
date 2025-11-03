import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { auth } from '@/lib/auth';
import { extractPrimaryRole } from '@/lib/role-utils';

export const dynamic = 'force-dynamic';

export default async function TherapistsLayout(props: {
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

  // Extract user role
  const userRole = extractPrimaryRole(session.user.roles);
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
