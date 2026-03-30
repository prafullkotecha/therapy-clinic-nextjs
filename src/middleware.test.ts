import { describe, expect, it, vi } from 'vitest';

vi.mock('@arcjet/next', () => ({
  detectBot: vi.fn(() => ({})),
}));

vi.mock('@/libs/Arcjet', () => ({
  default: {
    withRule: vi.fn(() => ({
      protect: vi.fn(async () => ({ isDenied: () => false })),
    })),
  },
}));

vi.mock('@/lib/middleware', () => ({
  requireAuth: vi.fn(async () => null),
  autoProtectRoutes: vi.fn(async () => null),
}));

vi.mock('next-intl/middleware', () => ({
  default: vi.fn(() => vi.fn(() => new Response(null, { status: 200 }))),
}));

describe('middleware dev-login locale fallback', () => {
  it('redirects /dev-login to default locale sign-in when bypass disabled', async () => {
    vi.stubEnv('DEV_BYPASS_AUTH', 'false');
    vi.stubEnv('NODE_ENV', 'production');
    const { default: middleware } = await import('./middleware');
    const nextUrl = new URL('http://localhost:3000/dev-login');
    const request = {
      nextUrl: Object.assign(nextUrl, {
        clone: () => new URL(nextUrl.toString()),
      }),
      headers: new Headers(),
    };
    const response = await middleware(request as any);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost:3000/en/sign-in');
    vi.unstubAllEnvs();
  });
});
