import { beforeEach, describe, expect, it, vi } from 'vitest';

const withTenantContextMock = vi.fn(async (_tenantId: string, operation: () => Promise<unknown>) => operation());
const limitMock = vi.fn();
const orderByMock = vi.fn();
const whereMock = vi.fn();
const innerJoinWhereMock = vi.fn();
const innerJoinMock = vi.fn(() => ({ where: innerJoinWhereMock }));
const fromMock = vi.fn(() => ({ where: whereMock, innerJoin: innerJoinMock }));
const selectMock = vi.fn(() => ({ from: fromMock }));

vi.mock('@/lib/tenant-db', () => ({ withTenantContext: withTenantContextMock }));
vi.mock('@/libs/DB', () => ({ db: { select: selectMock } }));

describe('therapist.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    whereMock.mockReturnValue({ limit: limitMock, orderBy: orderByMock });
  });

  it('getTherapistByUserId returns null when user has no therapist profile', async () => {
    const { getTherapistByUserId } = await import('../therapist.service');
    limitMock.mockResolvedValueOnce([]);

    const result = await getTherapistByUserId('tenant-1', 'user-1');

    expect(result).toBeNull();
  });

  it('getTherapistById throws not found error', async () => {
    const { getTherapistById } = await import('../therapist.service');
    limitMock.mockResolvedValueOnce([]);

    await expect(getTherapistById('tenant-1', 'missing')).rejects.toThrow('Therapist not found');
  });

  it('listTherapists returns empty list edge case', async () => {
    const { listTherapists } = await import('../therapist.service');
    orderByMock.mockResolvedValueOnce([]);

    const result = await listTherapists('tenant-1', {});

    expect(result).toEqual([]);
  });
});
