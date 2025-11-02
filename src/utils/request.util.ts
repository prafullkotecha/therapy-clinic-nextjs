/**
 * Request Utilities
 *
 * Helper functions for extracting information from HTTP requests
 */

import type { NextRequest } from 'next/server';

/**
 * Extract client IP address from a Next.js request
 *
 * Checks various headers in order of preference:
 * 1. x-real-ip (from reverse proxy)
 * 2. x-forwarded-for (from load balancer/proxy)
 * 3. Remote address from socket
 *
 * @param req - Next.js request object
 * @returns IP address or 'unknown' if not found
 */
export function getClientIp(req: NextRequest | Request): string {
  // Check x-real-ip header (set by nginx/reverse proxy)
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Check x-forwarded-for header (set by load balancers)
  // Format: client, proxy1, proxy2
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP (client IP)
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    if (ips[0]) {
      return ips[0];
    }
  }

  // Fallback to unknown
  return 'unknown';
}

/**
 * Extract user agent from a Next.js request
 *
 * @param req - Next.js request object
 * @returns User agent string or 'unknown' if not found
 */
export function getUserAgent(req: NextRequest | Request): string {
  const userAgent = req.headers.get('user-agent');
  return userAgent || 'unknown';
}

/**
 * Extract both IP and user agent in one call
 *
 * @param req - Next.js request object
 * @returns Object with ipAddress and userAgent
 */
export function getRequestInfo(req: NextRequest | Request): {
  ipAddress: string;
  userAgent: string;
} {
  return {
    ipAddress: getClientIp(req),
    userAgent: getUserAgent(req),
  };
}
