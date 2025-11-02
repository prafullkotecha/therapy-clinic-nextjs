import type { NextRequest } from 'next/server';
import { detectBot } from '@arcjet/next';
import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { autoProtectRoutes, requireAuth } from '@/lib/middleware';
import arcjet from '@/libs/Arcjet';
import { routing } from './libs/I18nRouting';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = (pathname: string) => {
  return pathname.includes('/dashboard');
};

// Improve security with Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    // Block all bots except the following
    allow: [
      // See https://docs.arcjet.com/bot-protection/identifying-bots
      'CATEGORY:SEARCH_ENGINE', // Allow search engines
      'CATEGORY:PREVIEW', // Allow preview links to show OG images
      'CATEGORY:MONITOR', // Allow uptime monitoring services
    ],
  }),
);

// Currently, with database connections, Webpack is faster than Turbopack in production environment at runtime.
// Then, unfortunately, Webpack doesn't support `proxy.ts` on Vercel yet, here is the error: "Error: ENOENT: no such file or directory, lstat '/vercel/path0/.next/server/proxy.js'"
export default async function middleware(
  request: NextRequest,
) {
  // Verify the request with Arcjet
  // Use `process.env` instead of Env to reduce bundle size in middleware
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Check authentication for protected routes
  if (isProtectedRoute(request.nextUrl.pathname)) {
    // Basic authentication check
    const authResponse = await requireAuth(request);
    if (authResponse) {
      return authResponse;
    }

    // Role-based route protection (checks /dashboard/admin, /dashboard/therapist, etc.)
    const roleResponse = await autoProtectRoutes(request);
    if (roleResponse) {
      return roleResponse;
    }
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  // - … API routes (`/api/*`)
  // - … if they start with `/_next`, `/_vercel` or `monitoring`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: '/((?!api|_next|_vercel|monitoring|.*\\..*).*)',
  runtime: 'nodejs',
};
