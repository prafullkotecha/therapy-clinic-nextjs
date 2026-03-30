import { beforeEach, describe, expect, it, vi } from 'vitest';

const withTenantContextMock = vi.fn(async (_tenantId: string, operation: () => Promise<unknown>) => operation());
const insertValuesMock = vi.fn();
const insertMock = vi.fn(() => ({ values: insertValuesMock }));
const selectLimitMock = vi.fn();
const selectWhereMock = vi.fn(() => ({ limit: selectLimitMock }));
const selectFromMock = vi.fn(() => ({ where: selectWhereMock }));
const selectMock = vi.fn(() => ({ from: selectFromMock }));
const updateReturningMock = vi.fn();
const updateWhereMock = vi.fn(() => ({ returning: updateReturningMock }));
const updateSetMock = vi.fn(() => ({ where: updateWhereMock }));
const updateMock = vi.fn(() => ({ set: updateSetMock }));

vi.mock('@/lib/tenant-db', () => ({ withTenantContext: withTenantContextMock }));
vi.mock('@/libs/DB', () => ({
  db: {
    insert: insertMock,
    select: selectMock,
    update: updateMock,
  },
}));
vi.mock('@/lib/encryption', () => ({
  getEncryptionServiceSync: () => ({
    encrypt: (value: string) => `enc:${value}`,
    decrypt: (value: string) => value.replace('enc:', ''),
  }),
}));
vi.mock('@/services/audit.service', () => ({ logAudit: vi.fn() }));

describe('session.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createSessionNote returns decrypted record on happy path', async () => {
    const { createSessionNote } = await import('../session.service');

    insertValuesMock.mockReturnValueOnce({
      returning: vi.fn().mockResolvedValueOnce([
        {
          id: 'session-1',
          tenantId: 'tenant-1',
          sessionSummary: 'enc:summary',
          clinicalNotes: 'enc:notes',
        },
      ]),
    });

    const result = await createSessionNote('tenant-1', {
      locationId: 'loc-1',
      appointmentId: 'apt-1',
      clientId: 'client-1',
      therapistId: 'therapist-1',
      sessionDate: '2026-03-30',
      startTime: new Date('2026-03-30T10:00:00.000Z'),
      endTime: new Date('2026-03-30T11:00:00.000Z'),
      durationMinutes: 60,
      sessionType: 'individual',
      units: 4,
      clientAttendance: 'present',
      sessionSummary: 'summary',
      clinicalNotes: 'notes',
      createdBy: 'user-1',
    });

    expect(result.sessionSummary).toBe('summary');
    expect(result.clinicalNotes).toBe('notes');
  });

  it('getSessionNote returns null when note is not found', async () => {
    const { getSessionNote } = await import('../session.service');

    selectLimitMock.mockResolvedValueOnce([]);

    const result = await getSessionNote('tenant-1', 'missing');

    expect(result).toBeNull();
  });

  it('updateSessionNote throws for missing note', async () => {
    const { updateSessionNote } = await import('../session.service');

    updateReturningMock.mockResolvedValueOnce([]);

    await expect(updateSessionNote('tenant-1', 'missing', { sessionSummary: 'x' })).rejects.toThrow('Session note not found');
  });
});
