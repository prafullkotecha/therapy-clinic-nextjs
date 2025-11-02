'use client';

import type { UserRole } from '@/lib/rbac';
import { useState } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

type AppShellProps = {
  children: React.ReactNode;
  userRole: UserRole;
  userName: string;
  userEmail: string;
  onSignOut: () => void;
};

export function AppShell({ children, userRole, userName, userEmail, onSignOut }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Skip to main content link (WCAG) */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Sidebar */}
      <Sidebar
        role={userRole}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          userName={userName}
          userEmail={userEmail}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          onSignOut={onSignOut}
        />

        {/* Breadcrumbs */}
        <Breadcrumbs />

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8"
          role="main"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
