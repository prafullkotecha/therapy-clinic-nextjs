import { describe, expect, it, vi } from 'vitest';
import { getDashboardStats, getTodayDateString } from './dashboard.service';

const withTenantContextMock = vi.fn(async (tenantId: string, operation: (db: unknown) => Promise<unknown>) => {
  void tenantId;
  return operation({});
});

const selectMock = vi.fn();
const fromMock = vi.fn();
const whereMock = vi.fn();
const orderByMock = vi.fn();
const limitMock = vi.fn();

vi.mock('@/lib/tenant-db', () => ({
  withTenantContext: (...args: Parameters<typeof withTenantContextMock>) => withTenantContextMock(...args),
}));

vi.mock('@/libs/DB', () => ({
  db: {
    select: (...args: Parameters<typeof selectMock>) => selectMock(...args),
  },
}));

vi.mock('drizzle-orm', async (importOriginal) => {
  const original = await importOriginal<typeof import('drizzle-orm')>();
  return {
    ...original,
    and: (...conditions: unknown[]) => ({ type: 'and', conditions }),
    eq: (left: unknown, right: unknown) => ({ type: 'eq', left, right }),
    sql: Object.assign(
      (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
      { raw: (value: string) => ({ raw: value }) },
    ),
  };
});

describe('dashboard.service', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const userId = '00000000-0000-0000-0000-000000000002';

  it('getTodayDateString should format YYYY-MM-DD', () => {
    expect(getTodayDateString('America/New_York', new Date('2026-03-23T09:00:00.000Z'))).toBe('2026-03-23');
  });

  it('getTodayDateString should respect timezone boundaries', () => {
    expect(getTodayDateString('America/Los_Angeles', new Date('2026-03-23T01:00:00.000Z'))).toBe('2026-03-22');
  });

  it('getTodayDateString should fallback for invalid timezone', () => {
    expect(getTodayDateString('invalid-timezone', new Date('2026-03-23T09:00:00.000Z'))).toBe('2026-03-23');
  });

  it('should return therapist-specific assigned client count', async () => {
    const therapistLimitMock = vi.fn().mockResolvedValueOnce([{ id: 'therapist-1' }]);
    limitMock.mockReset()
      .mockResolvedValueOnce([{
        id: 'activity-1',
        action: 'login_success',
        resource: 'authentication',
        timestamp: new Date('2026-03-23T10:00:00.000Z'),
      }]);
    orderByMock.mockReset().mockReturnValue({ limit: limitMock });
    whereMock.mockReset()
      .mockImplementationOnce(() => ({ limit: vi.fn().mockResolvedValueOnce([{ timezone: 'America/New_York' }]) }))
      .mockResolvedValueOnce([{ count: 8 }])
      .mockResolvedValueOnce([{ count: 3 }])
      .mockImplementationOnce(() => ({ orderBy: orderByMock }))
      .mockImplementationOnce(() => ({ limit: therapistLimitMock }))
      .mockResolvedValueOnce([{ count: 5 }]);
    fromMock.mockReset().mockReturnValue({ where: whereMock });
    selectMock.mockReset().mockReturnValue({ from: fromMock });

    const stats = await getDashboardStats(tenantId, userId, 'therapist');

    expect(stats).toEqual({
      totalClients: 8,
      todaysAppointments: 3,
      assignedClients: 5,
      recentActivity: [{
        id: 'activity-1',
        action: 'login_success',
        resource: 'authentication',
        timestamp: new Date('2026-03-23T10:00:00.000Z'),
      }],
    });
  });

  it('should return non-therapist assigned client count', async () => {
    limitMock.mockReset().mockResolvedValueOnce([]);
    orderByMock.mockReset().mockReturnValue({ limit: limitMock });
    whereMock.mockReset()
      .mockImplementationOnce(() => ({ limit: vi.fn().mockResolvedValueOnce([{ timezone: 'America/New_York' }]) }))
      .mockResolvedValueOnce([{ count: 12 }])
      .mockResolvedValueOnce([{ count: 7 }])
      .mockImplementationOnce(() => ({ orderBy: orderByMock }))
      .mockResolvedValueOnce([{ count: 9 }]);
    fromMock.mockReset().mockReturnValue({ where: whereMock });
    selectMock.mockReset().mockReturnValue({ from: fromMock });

    const stats = await getDashboardStats(tenantId, userId, 'billing');

    expect(stats).toEqual({
      totalClients: 12,
      todaysAppointments: 7,
      assignedClients: 9,
      recentActivity: [],
    });
  });

  it('evicts expired cache entries on read', async () => {
    const cacheTenantId = '00000000-0000-0000-0000-000000000099';
    const cacheUserId = '00000000-0000-0000-0000-000000000098';
    const nowSpy = vi.spyOn(Date, 'now');
    nowSpy.mockReturnValueOnce(1_000_000).mockReturnValueOnce(1_070_000);

    const therapistLimitMock = vi.fn().mockResolvedValue([{ id: 'therapist-1' }]);
    limitMock.mockReset().mockResolvedValue([]);
    orderByMock.mockReset().mockReturnValue({ limit: limitMock });
    whereMock.mockReset()
      .mockImplementationOnce(() => ({ limit: vi.fn().mockResolvedValue([{ timezone: 'America/New_York' }]) }))
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ count: 2 }])
      .mockImplementationOnce(() => ({ orderBy: orderByMock }))
      .mockImplementationOnce(() => ({ limit: therapistLimitMock }))
      .mockResolvedValueOnce([{ count: 3 }])
      .mockImplementationOnce(() => ({ limit: vi.fn().mockResolvedValue([{ timezone: 'America/New_York' }]) }))
      .mockResolvedValueOnce([{ count: 1 }])
      .mockResolvedValueOnce([{ count: 2 }])
      .mockImplementationOnce(() => ({ orderBy: orderByMock }))
      .mockImplementationOnce(() => ({ limit: therapistLimitMock }))
      .mockResolvedValueOnce([{ count: 3 }]);
    fromMock.mockReset().mockReturnValue({ where: whereMock });
    selectMock.mockReset().mockReturnValue({ from: fromMock });

    await getDashboardStats(cacheTenantId, cacheUserId, 'therapist');
    const callsAfterFirst = selectMock.mock.calls.length;
    await getDashboardStats(cacheTenantId, cacheUserId, 'therapist');

    expect(selectMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);

    nowSpy.mockRestore();
  });
});
