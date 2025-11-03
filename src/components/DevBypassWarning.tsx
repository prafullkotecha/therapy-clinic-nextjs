'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { DEV_BYPASS_TOKEN } from '@/lib/constants';

/**
 * Development Auth Bypass Warning Banner
 *
 * Displays a prominent warning when DEV_BYPASS_AUTH is enabled.
 * Shows current logged-in user and provides link to switch users.
 */
export function DevBypassWarning(): React.JSX.Element | null {
  const { data: session } = useSession();

  // Only show if user is logged in via dev bypass
  // (accessToken will be DEV_BYPASS_TOKEN for dev bypass logins)
  if (!session || session.accessToken !== DEV_BYPASS_TOKEN) {
    return null;
  }

  const userRole = session.user.roles?.[0] || 'Unknown';
  const userName = session.user.name || 'Unknown User';
  const userEmail = session.user.email || '';

  return (
    <div className="sticky top-0 z-50 border-b-4 border-yellow-600 bg-yellow-50">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex w-0 flex-1 items-center">
            <span className="flex rounded-lg bg-yellow-600 p-2">
              <svg className="size-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </span>
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-900">
                <span className="font-bold">DEV MODE</span>
                {' '}
                - Auth Bypass Active
              </p>
              <p className="text-xs text-yellow-800">
                Signed in as:
                {' '}
                <span className="font-semibold">{userName}</span>
                {' '}
                (
                {userRole}
                )
                {userEmail && (
                  <span className="ml-1 text-yellow-700">
                    {' • '}
                    {userEmail}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="order-3 mt-2 w-full shrink-0 sm:order-2 sm:mt-0 sm:w-auto">
            <Link
              href="/dev-login"
              className="flex items-center justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-yellow-700 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none"
            >
              Switch User
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
