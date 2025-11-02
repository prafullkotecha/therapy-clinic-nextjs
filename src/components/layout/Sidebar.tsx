'use client';

import type { UserRole } from '@/lib/rbac';
import {
  AcademicCapIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  DocumentTextIcon,
  HomeIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { getAccessibleResources, UserRoles } from '@/lib/rbac';

type SidebarProps = {
  role: UserRole;
  isOpen: boolean;
  onToggle: () => void;
};

// Navigation configuration based on role
const navigationConfig = {
  [UserRoles.ADMIN]: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Specializations', href: '/admin/specializations', icon: AcademicCapIcon, resource: 'therapists' },
    { name: 'Therapists', href: '/admin/therapists', icon: UserGroupIcon, resource: 'therapists' },
    { name: 'Clients', href: '/admin/clients', icon: UsersIcon, resource: 'clients' },
    { name: 'Appointments', href: '/admin/appointments', icon: CalendarIcon, resource: 'appointments' },
    { name: 'Billing', href: '/admin/billing', icon: CreditCardIcon, resource: 'billing' },
    { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon, resource: 'reports' },
    { name: 'Users', href: '/admin/users', icon: Cog6ToothIcon, resource: 'users' },
    { name: 'Audit Logs', href: '/admin/audit', icon: DocumentTextIcon, resource: 'audit_logs' },
  ],
  [UserRoles.THERAPIST]: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'My Clients', href: '/dashboard/clients', icon: UsersIcon, resource: 'clients' },
    { name: 'My Appointments', href: '/dashboard/appointments', icon: CalendarIcon, resource: 'appointments' },
    { name: 'Documentation', href: '/dashboard/documentation', icon: DocumentTextIcon },
    { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon, resource: 'reports' },
  ],
  [UserRoles.BILLING]: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Billing', href: '/dashboard/billing', icon: CreditCardIcon, resource: 'billing' },
    { name: 'Clients', href: '/dashboard/clients', icon: UsersIcon, resource: 'clients' },
    { name: 'Reports', href: '/dashboard/reports', icon: ChartBarIcon, resource: 'reports' },
  ],
  [UserRoles.RECEPTIONIST]: [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Clients', href: '/dashboard/clients', icon: UsersIcon, resource: 'clients' },
    { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarIcon, resource: 'appointments' },
    { name: 'Therapists', href: '/dashboard/therapists', icon: UsersIcon, resource: 'therapists' },
  ],
};

export function Sidebar({ role, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const navigation = navigationConfig[role] || [];
  const accessibleResources = getAccessibleResources(role);

  // Filter navigation based on RBAC permissions
  const filteredNav = navigation.filter((item) => {
    if (!item.resource) {
      return true;
    } // Always show non-resource items (Dashboard)
    return accessibleResources.includes(item.resource as any);
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="bg-opacity-75 fixed inset-0 z-40 bg-gray-600 lg:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          {
            'translate-x-0': isOpen,
            '-translate-x-full': !isOpen,
          },
        )}
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-gray-200 px-6">
          <h1 className="text-xl font-bold text-primary-600">
            Therapy Clinic
          </h1>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3" aria-label="Main navigation">
          <ul className="space-y-1">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      {
                        'bg-primary-50 text-primary-700': isActive,
                        'text-gray-700 hover:bg-gray-100': !isActive,
                      },
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
