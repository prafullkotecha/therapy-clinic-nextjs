'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Development Login Page
 *
 * Allows signing in as any seeded user role for testing purposes.
 * Only available when DEV_BYPASS_AUTH=true and NODE_ENV=development.
 */

const DEV_USERS = [
  {
    role: 'Admin',
    redirectPath: '/admin',
    email: 'admin@brightfutures.test',
    name: 'Alexandra Martinez',
    description: 'Full system access, user management, reports',
    icon: '👑',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    hoverColor: 'hover:bg-purple-200',
  },
  {
    role: 'Therapist',
    redirectPath: '/dashboard/therapist',
    email: 'dr.sarah.johnson@brightfutures.test',
    name: 'Dr. Sarah Johnson',
    description: 'ABA specialist, manage clients, appointments, session notes',
    icon: '👨‍⚕️',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    hoverColor: 'hover:bg-blue-200',
  },
  {
    role: 'Billing',
    redirectPath: '/dashboard',
    email: 'lisa.anderson@brightfutures.test',
    name: 'Lisa Anderson',
    description: 'Invoices, insurance claims, payment processing',
    icon: '💰',
    color: 'bg-green-100 text-green-700 border-green-300',
    hoverColor: 'hover:bg-green-200',
  },
  {
    role: 'Receptionist',
    redirectPath: '/dashboard',
    email: 'james.wilson@brightfutures.test',
    name: 'James Wilson',
    description: 'Schedule appointments, check-ins, waitlist management',
    icon: '📋',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    hoverColor: 'hover:bg-yellow-200',
  },
];

export default function DevLoginPage(): React.JSX.Element {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(email: string, redirectPath: string, roleName: string): Promise<void> {
    setLoading(roleName);
    setError(null);

    try {
      const result = await signIn('dev-bypass', {
        email,
        redirect: false,
      });

      if (result?.error) {
        setError(`Failed to sign in: ${result.error}`);
        setLoading(null);
      } else if (result?.ok) {
        // Redirect to role-specific dashboard
        router.push(redirectPath);
      }
    } catch (err) {
      setError(`Sign in error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setLoading(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Warning Banner */}
        <div className="rounded-lg border-2 border-red-400 bg-red-50 p-4">
          <div className="flex">
            <div className="shrink-0">
              <svg className="size-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Development Mode</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>This page bypasses Keycloak authentication and should ONLY be used in development.</p>
                <p className="mt-1">Never enable DEV_BYPASS_AUTH in production!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Development Login</h2>
          <p className="mt-2 text-sm text-gray-600">
            Select a role to sign in and test the application
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="shrink-0">
                <svg className="size-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Role Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          {DEV_USERS.map(user => (
            <div
              key={user.role}
              className={`rounded-lg border-2 ${user.color} p-6 transition-all ${user.hoverColor}`}
            >
              <div className="flex items-start">
                <span className="text-4xl">{user.icon}</span>
                <div className="ml-4 flex-1">
                  <h3 className="text-lg font-semibold">{user.role}</h3>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="mt-2 text-xs">{user.description}</p>
                  <p className="mt-2 font-mono text-xs">{user.email}</p>

                  <button
                    type="button"
                    onClick={() => handleSignIn(user.email, user.redirectPath, user.role)}
                    disabled={loading !== null}
                    className={`mt-4 w-full rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                      loading === user.role
                        ? 'cursor-not-allowed bg-gray-400'
                        : 'bg-gray-800 hover:bg-gray-700 focus:ring-gray-500'
                    }`}
                  >
                    {loading === user.role
                      ? (
                          <span className="flex items-center justify-center">
                            <svg className="mr-3 -ml-1 size-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Signing in...
                          </span>
                        )
                      : (
                          `Sign in as ${user.role}`
                        )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Testing Guide Link */}
        <div className="rounded-lg border border-gray-300 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">Testing Guide</h3>
          <p className="mt-2 text-sm text-gray-600">
            After signing in, follow the role-specific testing guide to verify functionality:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-gray-600">
            <li>
              <strong>Admin:</strong>
              {' '}
              Test user management, view all data, access reports
            </li>
            <li>
              <strong>Therapist:</strong>
              {' '}
              View assigned clients, manage schedule, add session notes
            </li>
            <li>
              <strong>Billing:</strong>
              {' '}
              Review invoices, process insurance claims, generate statements
            </li>
            <li>
              <strong>Receptionist:</strong>
              {' '}
              Schedule appointments, check-in clients, manage waitlist
            </li>
          </ul>
          <p className="mt-3 text-xs text-gray-500">
            See
            {' '}
            <code className="rounded bg-gray-100 px-1 py-0.5">docs/DEV_AUTH_TESTING.md</code>
            {' '}
            for detailed testing steps.
          </p>
        </div>
      </div>
    </div>
  );
}
