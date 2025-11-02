/**
 * Auth Context Utilities
 *
 * Helpers for reading request context (IP address, user agent) captured by middleware
 * for use in NextAuth callbacks that don't have direct access to request headers.
 */

import { cookies } from 'next/headers';

export type AuthRequestContext = {
  ipAddress: string;
  userAgent: string;
};

/**
 * Get request context from cookies set by middleware
 *
 * Middleware captures IP address and user agent in HTTP-only cookies
 * that this function reads to provide to auth callbacks.
 *
 * @returns Request context with IP address and user agent
 */
export async function getAuthRequestContext(): Promise<AuthRequestContext> {
  const cookieStore = await cookies();

  const ipAddress = cookieStore.get('__auth_ip')?.value ?? 'unavailable';
  const userAgent = cookieStore.get('__auth_ua')?.value ?? 'unavailable';

  return {
    ipAddress,
    userAgent,
  };
}
