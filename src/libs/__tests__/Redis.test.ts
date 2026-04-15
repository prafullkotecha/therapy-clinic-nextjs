import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();

vi.mock('redis', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

describe('libs/Redis', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    createClientMock.mockReset();
    delete (globalThis as { redisClient?: unknown }).redisClient;
    vi.stubEnv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/therapy_clinic_dev');
    vi.stubEnv('REDIS_URL', 'redis://localhost:6379');
  });

  it('creates a redis client with REDIS_URL', async () => {
    const fakeClient = { kind: 'redis-client' };
    createClientMock.mockReturnValue(fakeClient);

    const { redis } = await import('../Redis');

    expect(createClientMock).toHaveBeenCalledWith({ url: 'redis://localhost:6379' });
    expect(redis).toBe(fakeClient);
  });

  it('reuses global redis client in non-production mode', async () => {
    const fakeClient = { kind: 'redis-client-dev' };
    vi.stubEnv('NODE_ENV', 'development');
    createClientMock.mockReturnValue(fakeClient);

    const first = await import('../Redis');
    const second = await import('../Redis');

    expect(first.redis).toBe(fakeClient);
    expect(second.redis).toBe(fakeClient);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });

  it('does not persist redis client in global cache in production mode', async () => {
    const firstClient = { kind: 'redis-client-prod-1' };
    const secondClient = { kind: 'redis-client-prod-2' };
    vi.stubEnv('NODE_ENV', 'production');
    createClientMock.mockReturnValueOnce(firstClient).mockReturnValueOnce(secondClient);

    const first = await import('../Redis');
    vi.resetModules();
    const second = await import('../Redis');

    expect(first.redis).toBe(firstClient);
    expect(second.redis).toBe(secondClient);
    expect(createClientMock).toHaveBeenCalledTimes(2);
    expect((globalThis as { redisClient?: unknown }).redisClient).toBeUndefined();
  });
});
