import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectWhereMock = vi.fn();
const selectFromMock = vi.fn(() => ({ where: selectWhereMock }));
const selectMock = vi.fn(() => ({ from: selectFromMock }));
const insertValuesMock = vi.fn();
const insertMock = vi.fn(() => ({ values: insertValuesMock }));

vi.mock('@/libs/DB', () => ({ db: { select: selectMock, insert: insertMock, update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => ({ returning: vi.fn().mockResolvedValue([{ id: 'tenant-1' }]) })) })) })) } }));
vi.mock('@/lib/tenant-db', () => ({ withTenantContext: vi.fn(async (_t, op) => op()), setTenantContext: vi.fn() }));

describe('tenant.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createTenant creates tenant happy path', async () => {
    const { createTenant } = await import('../tenant.service');
    selectWhereMock.mockResolvedValueOnce([]);
    insertValuesMock.mockReturnValueOnce({ returning: vi.fn().mockResolvedValueOnce([{ id: 'tenant-1', slug: 'acme' }]) });
    const result = await createTenant({ name: 'Acme', slug: 'acme' });
    expect(result.id).toBe('tenant-1');
  });

  it('createTenant throws on duplicate slug', async () => {
    const { createTenant } = await import('../tenant.service');
    selectWhereMock.mockResolvedValueOnce([{ id: 'existing' }]);
    await expect(createTenant({ name: 'Acme', slug: 'acme' })).rejects.toThrow('Tenant with slug "acme" already exists');
  });

  it('getTenantById returns null edge case', async () => {
    const { getTenantById } = await import('../tenant.service');
    selectWhereMock.mockResolvedValueOnce([]);
    const result = await getTenantById('missing');
    expect(result).toBeNull();
  });
});
