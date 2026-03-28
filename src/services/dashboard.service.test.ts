import { describe, expect, it, vi } from 'vitest';
import { getTodayDateString, getDashboardStats } from './dashboard.service';

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
    expect(getTodayDateString(new Date('2026-03-23T09:00:00.000Z'))).toBe('2026-03-23');
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
});
