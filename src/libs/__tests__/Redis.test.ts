import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClientMock = vi.fn();

vi.mock('redis', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
}));

describe('libs/Redis', () => {
  beforeEach(() => {
    vi.resetModules();
    createClientMock.mockReset();
    delete (globalThis as { redisClient?: unknown }).redisClient;
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/therapy_clinic_dev';
    process.env.REDIS_URL = 'redis://localhost:6379';
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
    process.env.NODE_ENV = 'development';
    createClientMock.mockReturnValue(fakeClient);

    const first = await import('../Redis');
    const second = await import('../Redis');

    expect(first.redis).toBe(fakeClient);
    expect(second.redis).toBe(fakeClient);
    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});
