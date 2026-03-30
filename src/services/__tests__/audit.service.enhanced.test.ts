import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/DB', () => {
  return {
    db: {
      execute: vi.fn(),
      insert: vi.fn(() => ({ values: vi.fn() })),
    },
  };
});

vi.mock('@/models/user.schema', () => ({
  auditLogs: {
    tenantId: 'tenant_id',
    timestamp: 'timestamp',
    userId: 'user_id',
    action: 'action',
    resource: 'resource',
  },
}));

import { db } from '@/libs/DB';
import {
  HIPAA_AUDIT_RETENTION_YEARS,
  archiveAuditLogsOlderThanRetention,
  getAuditLogChainIntegrity,
  logAudit,
  searchAuditLogs,
} from '@/services/audit.service';

const executeMock = vi.mocked(db.execute);

describe('audit.service enhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAudit', () => {
    it('writes tamper-evident hash-linked record via SQL path', async () => {
      executeMock
        .mockResolvedValueOnce({ rows: [{ record_hash: 'prev-hash' }] } as never)
        .mockResolvedValueOnce({ rows: [] } as never);

      await logAudit('tenant-1', {
        userId: 'user-1',
        action: 'read',
        resource: 'clients',
        resourceType: 'phi',
        metadata: { field: 'firstName' },
      });

      expect(executeMock).toHaveBeenCalledTimes(2);
      expect(executeMock.mock.calls[1]?.[0]).toBeDefined();
    });

    it('uses empty previous hash when no history exists', async () => {
      executeMock
        .mockResolvedValueOnce({ rows: [{ record_hash: null }] } as never)
        .mockResolvedValueOnce({ rows: [] } as never);

      await logAudit('tenant-1', {
        userId: 'user-1',
        action: 'create',
        resource: 'consents',
      });

      expect(executeMock).toHaveBeenCalledTimes(2);
    });

    it('propagates db insert failure', async () => {
      executeMock
        .mockResolvedValueOnce({ rows: [{ record_hash: null }] } as never)
        .mockRejectedValueOnce(new Error('insert failed'));

      await expect(logAudit('tenant-1', {
        userId: 'user-1',
        action: 'update',
        resource: 'clients',
      })).rejects.toThrow('insert failed');
    });
  });

  describe('searchAuditLogs', () => {
    it('applies filter query and returns rows', async () => {
      executeMock.mockResolvedValueOnce({
        rows: [
          {
            id: 'a1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            action: 'read',
            resource: 'clients',
            resourceType: 'phi',
            resourceId: null,
            timestamp: new Date(),
            changes: null,
            previousHash: null,
            recordHash: 'hash-1',
          },
        ],
      } as never);

      const result = await searchAuditLogs('tenant-1', {
        userId: 'user-1',
        action: 'read',
        resource: 'clients',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
      });

      expect(executeMock).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0]?.recordHash).toBe('hash-1');
    });

    it('works with no optional filters', async () => {
      executeMock.mockResolvedValueOnce({ rows: [] } as never);
      const result = await searchAuditLogs('tenant-1', {});
      expect(result).toEqual([]);
    });

    it('propagates query failures', async () => {
      executeMock.mockRejectedValueOnce(new Error('search failed'));
      await expect(searchAuditLogs('tenant-1', {})).rejects.toThrow('search failed');
    });
  });

  describe('getAuditLogChainIntegrity', () => {
    it('validates healthy chain', async () => {
      const timestamp = new Date('2026-01-01T00:00:00.000Z');

      executeMock.mockResolvedValueOnce({
        rows: [
          {
            id: '1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            action: 'read',
            resource: 'clients',
            resourceType: 'phi',
            resourceId: null,
            timestamp,
            changes: { one: 1 },
            previousHash: null,
            recordHash: 'f7585d18d1b346fd4ab72362a056822f0da69bccaf8286768b58490511cb3a7b',
          },
        ],
      } as never);

      const result = await getAuditLogChainIntegrity('tenant-1');

      expect(result.isValid).toBe(true);
      expect(result.totalRecords).toBe(1);
      expect(result.brokenAtId).toBeNull();
    });

    it('detects tampering in chain', async () => {
      executeMock.mockResolvedValueOnce({
        rows: [
          {
            id: '1',
            tenantId: 'tenant-1',
            userId: 'user-1',
            action: 'read',
            resource: 'clients',
            resourceType: 'phi',
            resourceId: null,
            timestamp: new Date('2026-01-01T00:00:00.000Z'),
            changes: null,
            previousHash: null,
            recordHash: 'invalid-hash',
          },
        ],
      } as never);

      const result = await getAuditLogChainIntegrity('tenant-1');

      expect(result.isValid).toBe(false);
      expect(result.brokenAtId).toBe('1');
    });

    it('returns valid result for empty chain', async () => {
      executeMock.mockResolvedValueOnce({ rows: [] } as never);
      const result = await getAuditLogChainIntegrity('tenant-1');
      expect(result.isValid).toBe(true);
      expect(result.totalRecords).toBe(0);
    });
  });

  describe('archiveAuditLogsOlderThanRetention', () => {
    it('uses 7-year retention and returns stub response', async () => {
      executeMock.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] } as never);

      const result = await archiveAuditLogsOlderThanRetention('tenant-1');

      expect(HIPAA_AUDIT_RETENTION_YEARS).toBe(7);
      expect(executeMock).toHaveBeenCalledTimes(1);
      expect(result.archivedCount).toBe(0);
      expect(result.cutoffDate).toBeInstanceOf(Date);
    });

    it('returns close cutoff dates across repeated calls', async () => {
      executeMock.mockResolvedValueOnce({ rows: [] } as never);
      const first = await archiveAuditLogsOlderThanRetention('tenant-1');
      executeMock.mockResolvedValueOnce({ rows: [] } as never);
      const second = await archiveAuditLogsOlderThanRetention('tenant-1');
      expect(Math.abs(first.cutoffDate.getTime() - second.cutoffDate.getTime())).toBeLessThan(50);
    });

    it('propagates archive query failure', async () => {
      executeMock.mockRejectedValueOnce(new Error('archive failed'));
      await expect(archiveAuditLogsOlderThanRetention('tenant-1')).rejects.toThrow('archive failed');
    });
  });
});
