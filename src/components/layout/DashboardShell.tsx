'use client';

import type { UserRole } from '@/lib/rbac';
import { useTransition } from 'react';
import { AppShell } from './AppShell';

type DashboardShellProps = {
  children: React.ReactNode;
  userRole: UserRole;
  userName: string;
  userEmail: string;
};

export function DashboardShell({ children, userRole, userName, userEmail }: DashboardShellProps) {
  const [, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(() => {
      window.location.href = '/api/auth/signout';
    });
  };

  return (
    <AppShell
      userRole={userRole}
      userName={userName}
      userEmail={userEmail}
      onSignOut={handleSignOut}
    >
      {children}
    </AppShell>
  );
}
