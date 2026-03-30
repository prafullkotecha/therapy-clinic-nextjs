import { describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/DB', () => ({ db: {} }));
vi.mock('@/lib/tenant-db', () => ({ withTenantContext: vi.fn() }));
vi.mock('@/lib/encryption', () => ({ getEncryptionServiceSync: vi.fn() }));
vi.mock('@/services/audit.service', () => ({ logAudit: vi.fn() }));

describe('client.service', () => {
  const baseClient = {
    id: 'client-1',
    firstName: 'Alice',
    lastName: 'Smith',
    dateOfBirth: '2017-01-01',
    ssn: '123-45-6789',
    address: '123 Main',
    insurancePolicyNumber: 'POL-1',
    emergencyContactPhone: '555-1111',
  } as never;

  it('returns full data for admin happy path', async () => {
    const { filterClientFieldsByRole } = await import('../client.service');
    const result = filterClientFieldsByRole(baseClient, 'admin');
    expect(result.ssn).toBe('123-45-6789');
    expect(result.address).toBe('123 Main');
  });

  it('redacts sensitive fields for therapist', async () => {
    const { filterClientFieldsByRole } = await import('../client.service');
    const result = filterClientFieldsByRole(baseClient, 'therapist');
    expect(result.ssn).toBeUndefined();
    expect(result.insurancePolicyNumber).toBeUndefined();
  });

  it('returns minimal data for unknown role edge case', async () => {
    const { filterClientFieldsByRole } = await import('../client.service');
    const result = filterClientFieldsByRole(baseClient, 'unknown');
    expect(result.id).toBe('client-1');
    expect(result.ssn).toBe('123-45-6789');
  });
});
