import { beforeEach, describe, expect, it, vi } from 'vitest';

const insertValues = vi.fn();
const updateSet = vi.fn();
const updateWhere = vi.fn();
const selectFrom = vi.fn();
const selectWhere = vi.fn();
const selectOrderBy = vi.fn();
const selectLimit = vi.fn();

vi.mock('@/models/consent.schema', () => ({
  consents: {
    id: 'id',
    tenantId: 'tenantId',
    clientId: 'clientId',
    consentType: 'consentType',
    status: 'status',
    expiresAt: 'expiresAt',
    grantedAt: 'grantedAt',
  },
}));

vi.mock('@/libs/DB', () => ({
  db: {
    insert: vi.fn(() => ({ values: insertValues })),
    update: vi.fn(() => ({ set: updateSet })),
    select: vi.fn(() => ({ from: selectFrom })),
  },
}));

import { db } from '@/libs/DB';
import {
  getActiveConsents,
  getConsentHistory,
  grantConsent,
  isConsentValid,
  revokeConsent,
} from '@/services/consent.service';

describe('consent.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertValues.mockResolvedValue(undefined);
    updateSet.mockReturnValue({ where: updateWhere });
    updateWhere.mockResolvedValue(undefined);
    selectFrom.mockReturnValue({ where: selectWhere });
    selectWhere.mockReturnValue({ orderBy: selectOrderBy, limit: selectLimit });
    selectOrderBy.mockResolvedValue([]);
    selectLimit.mockResolvedValue([]);
  });

  describe('grantConsent', () => {
    it('inserts active treatment consent record', async () => {
      await grantConsent('tenant-1', 'client-1', 'treatment', 'v1', 'sig-hash');

      expect(db.insert).toHaveBeenCalledTimes(1);
      expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
        tenantId: 'tenant-1',
        clientId: 'client-1',
        consentType: 'treatment',
        status: 'active',
      }));
    });

    it('supports telehealth consent grants', async () => {
      await grantConsent('tenant-1', 'client-1', 'telehealth', 'v2', 'sig-hash-2');

      expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({
        consentType: 'telehealth',
        documentVersion: 'v2',
        signatureHash: 'sig-hash-2',
      }));
    });

    it('propagates insert errors', async () => {
      insertValues.mockRejectedValueOnce(new Error('insert failed'));

      await expect(
        grantConsent('tenant-1', 'client-1', 'research', 'v1', 'sig-hash'),
      ).rejects.toThrow('insert failed');
    });
  });

  describe('revokeConsent', () => {
    it('updates consent status and reason', async () => {
      await revokeConsent('tenant-1', 'consent-1', 'withdrawn by guardian');

      expect(db.update).toHaveBeenCalledTimes(1);
      expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({
        status: 'revoked',
        revocationReason: 'withdrawn by guardian',
      }));
    });

    it('sets revoked timestamp when revoking', async () => {
      await revokeConsent('tenant-1', 'consent-2', 'expired policy');
      const setArg = updateSet.mock.calls[0]?.[0] as { revokedAt: Date };

      expect(setArg.revokedAt).toBeInstanceOf(Date);
    });

    it('propagates update errors', async () => {
      updateWhere.mockRejectedValueOnce(new Error('update failed'));
      await expect(revokeConsent('tenant-1', 'consent-3', 'reason')).rejects.toThrow('update failed');
    });
  });

  describe('getActiveConsents', () => {
    it('returns active consent records', async () => {
      selectOrderBy.mockResolvedValueOnce([{ id: 'c1' }]);

      const result = await getActiveConsents('tenant-1', 'client-1');

      expect(result).toEqual([{ id: 'c1' }]);
    });

    it('returns empty array when none active', async () => {
      selectOrderBy.mockResolvedValueOnce([]);

      const result = await getActiveConsents('tenant-1', 'client-1');

      expect(result).toEqual([]);
    });

    it('propagates query errors', async () => {
      selectOrderBy.mockRejectedValueOnce(new Error('query failed'));
      await expect(getActiveConsents('tenant-1', 'client-1')).rejects.toThrow('query failed');
    });
  });

  describe('isConsentValid', () => {
    it('returns true for existing active consent', async () => {
      selectLimit.mockResolvedValueOnce([{ id: 'consent-1' }]);

      const valid = await isConsentValid('tenant-1', 'client-1', 'telehealth');

      expect(valid).toBe(true);
    });

    it('returns false for missing active consent', async () => {
      selectLimit.mockResolvedValueOnce([]);

      const valid = await isConsentValid('tenant-1', 'client-1', 'research');

      expect(valid).toBe(false);
    });

    it('propagates query errors', async () => {
      selectLimit.mockRejectedValueOnce(new Error('query failed'));
      await expect(isConsentValid('tenant-1', 'client-1', 'data_sharing')).rejects.toThrow('query failed');
    });
  });

  describe('getConsentHistory', () => {
    it('returns sorted consent history', async () => {
      selectOrderBy.mockResolvedValueOnce([{ id: 'new' }, { id: 'old' }]);

      const history = await getConsentHistory('tenant-1', 'client-1');

      expect(history).toEqual([{ id: 'new' }, { id: 'old' }]);
    });

    it('returns empty history when no records', async () => {
      selectOrderBy.mockResolvedValueOnce([]);

      const history = await getConsentHistory('tenant-1', 'client-1');

      expect(history).toEqual([]);
    });

    it('propagates query errors', async () => {
      selectOrderBy.mockRejectedValueOnce(new Error('history failed'));
      await expect(getConsentHistory('tenant-1', 'client-1')).rejects.toThrow('history failed');
    });
  });
});
