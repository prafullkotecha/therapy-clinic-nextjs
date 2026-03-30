import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectWhereMock = vi.fn();
const selectFromMock = vi.fn(() => ({
  leftJoin: vi.fn(() => ({
    leftJoin: vi.fn(() => ({
      where: selectWhereMock,
    })),
  })),
}));
const selectMock = vi.fn(() => ({ from: selectFromMock }));

vi.mock('@/libs/DB', () => ({ db: { select: selectMock } }));

describe('matching.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculateMatches returns ranked matches happy path', async () => {
    const { matchingService } = await import('../matching.service');

    selectWhereMock.mockResolvedValueOnce([
      {
        therapist: {
          id: 't1',
          tenantId: 'tenant-1',
          isAcceptingNewClients: true,
          availability: { monday: ['09:00'] },
          ageGroupExpertise: ['school_age'],
          communicationExpertise: ['verbal'],
          currentCaseload: 2,
          maxCaseload: 10,
        },
        specialization: {
          specializationId: 's1',
          specializationName: 'ABA',
          proficiencyLevel: 'expert',
          yearsExperience: 5,
        },
      },
    ]);

    const result = await matchingService.calculateMatches('tenant-1', {
      requiredSpecializations: [{ specializationId: 's1', importance: 'critical' }],
    });

    expect(result.length).toBe(1);
    expect(result[0]?.therapistId).toBe('t1');
  });

  it('calculateMatches returns empty when no therapist found', async () => {
    const { matchingService } = await import('../matching.service');
    selectWhereMock.mockResolvedValueOnce([]);

    const result = await matchingService.calculateMatches('tenant-1', {
      requiredSpecializations: [{ specializationId: 's1', importance: 'critical' }],
    });

    expect(result).toEqual([]);
  });

  it('calculateMatches handles optional criteria edge case', async () => {
    const { matchingService } = await import('../matching.service');
    selectWhereMock.mockResolvedValueOnce([
      {
        therapist: {
          id: 't2',
          tenantId: 'tenant-1',
          isAcceptingNewClients: true,
          availability: null,
          ageGroupExpertise: null,
          communicationExpertise: null,
          currentCaseload: 9,
          maxCaseload: 10,
        },
        specialization: {
          specializationId: 's2',
          specializationName: 'CBT',
          proficiencyLevel: 'familiar',
          yearsExperience: 1,
        },
      },
    ]);

    const result = await matchingService.calculateMatches('tenant-1', {
      requiredSpecializations: [{ specializationId: 's2', importance: 'nice_to_have' }],
      urgency: 'low',
    });

    expect(result.length).toBe(1);
  });
});
