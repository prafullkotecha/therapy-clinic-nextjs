'use client';

import type { Session } from 'next-auth';
import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

type AuthProviderProps = {
  children: ReactNode;
  session?: Session | null;
};

/**
 * Auth context provider for client components
 * Wraps next-auth's SessionProvider
 *
 * Must be placed in root layout to enable auth hooks throughout the app
 *
 * @example app/[locale]/layout.tsx
 * ```tsx
 * import { AuthProvider } from '@/components/providers/AuthProvider';
 *
 * export default function RootLayout({ children }: { children: ReactNode }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider
      session={session}
      // Refetch session every 5 minutes (HIPAA 15 min timeout)
      refetchInterval={5 * 60}
      // Refetch when window regains focus
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
