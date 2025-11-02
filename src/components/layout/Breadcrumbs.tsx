'use client';

import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

type Breadcrumb = {
  name: string;
  href: string;
  icon?: typeof HomeIcon;
};

export function Breadcrumbs() {
  const pathname = usePathname();

  // Parse pathname into breadcrumb segments
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter(seg => seg !== 'en' && seg !== 'fr'); // Filter out locale

  if (segments.length === 0 || segments[0] !== 'dashboard') {
    return null; // Don't show breadcrumbs outside dashboard
  }

  const breadcrumbs: Breadcrumb[] = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    ...segments.slice(1).map((segment, index) => ({
      name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
      href: `/dashboard/${segments.slice(1, index + 2).join('/')}`,
    })),
  ];

  return (
    <nav className="border-b border-gray-200 bg-white px-4 py-3" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <Fragment key={crumb.href}>
            {index > 0 && (
              <ChevronRightIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
            )}
            <li>
              {index === breadcrumbs.length - 1
                ? (
                    <span className="flex items-center font-medium text-gray-900" aria-current="page">
                      {index === 0 && crumb.icon && (
                        <crumb.icon className="mr-1 h-4 w-4" aria-hidden="true" />
                      )}
                      {crumb.name}
                    </span>
                  )
                : (
                    <Link
                      href={crumb.href}
                      className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                      {index === 0 && crumb.icon && (
                        <crumb.icon className="mr-1 h-4 w-4" aria-hidden="true" />
                      )}
                      {crumb.name}
                    </Link>
                  )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
