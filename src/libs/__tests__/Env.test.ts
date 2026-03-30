import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('libs/Env', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/therapy_clinic_dev';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.NEXTAUTH_URL;
    delete process.env.AUTH_SECRET;
    delete process.env.AUTH_URL;
  });

  it('accepts v5 AUTH_* variables', async () => {
    process.env.AUTH_SECRET = 'auth-secret-v5';
    process.env.AUTH_URL = 'http://localhost:3000';

    const { Env } = await import('../Env');

    expect(Env.AUTH_SECRET).toBe('auth-secret-v5');
    expect(Env.AUTH_URL).toBe('http://localhost:3000');
    expect(Env.NEXTAUTH_SECRET).toBe('auth-secret-v5');
    expect(Env.NEXTAUTH_URL).toBe('http://localhost:3000');
  });

  it('accepts legacy v4 NEXTAUTH_* variables', async () => {
    process.env.NEXTAUTH_SECRET = 'nextauth-secret-v4';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';

    const { Env } = await import('../Env');

    expect(Env.NEXTAUTH_SECRET).toBe('nextauth-secret-v4');
    expect(Env.NEXTAUTH_URL).toBe('http://localhost:3000');
    expect(Env.AUTH_SECRET).toBe('nextauth-secret-v4');
    expect(Env.AUTH_URL).toBe('http://localhost:3000');
  });
});
