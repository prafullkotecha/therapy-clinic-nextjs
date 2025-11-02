/**
 * Unit tests for Audit Service
 */

import type { AuthEventType } from './audit.service';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { logAuthEvent, logLoginFailed, logLoginSuccess, logLogout, logRegister } from './audit.service';

// Mock the database
vi.mock('@/libs/DB', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
  },
}));

// Mock the audit logs schema
vi.mock('@/models/user.schema', () => ({
  auditLogs: 'auditLogs',
}));

describe('Audit Service', () => {
  const mockTenantId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  const mockIpAddress = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/91.0';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logAuthEvent', () => {
    it('should log authentication event with all parameters', async () => {
      const { db } = await import('@/libs/DB');

      await logAuthEvent({
        tenantId: mockTenantId,
        userId: mockUserId,
        eventType: 'login_success',
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        details: { method: 'keycloak' },
      });

      expect(db.insert).toHaveBeenCalled();
    });

    it('should log authentication event without userId for failed login', async () => {
      const { db } = await import('@/libs/DB');

      await logAuthEvent({
        tenantId: mockTenantId,
        userId: null,
        eventType: 'login_failed',
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
        details: { identifier: 'user@example.com', reason: 'invalid_credentials' },
      });

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle missing details parameter', async () => {
      const { db } = await import('@/libs/DB');

      await logAuthEvent({
        tenantId: mockTenantId,
        userId: mockUserId,
        eventType: 'logout',
        ipAddress: mockIpAddress,
        userAgent: mockUserAgent,
      });

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('logLoginSuccess', () => {
    it('should log successful login', async () => {
      const { db } = await import('@/libs/DB');

      await logLoginSuccess(mockTenantId, mockUserId, mockIpAddress, mockUserAgent);

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('logLoginFailed', () => {
    it('should log failed login with reason', async () => {
      const { db } = await import('@/libs/DB');

      await logLoginFailed(
        mockTenantId,
        'user@example.com',
        mockIpAddress,
        mockUserAgent,
        'invalid_credentials',
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should log failed login without reason', async () => {
      const { db } = await import('@/libs/DB');

      await logLoginFailed(mockTenantId, 'user@example.com', mockIpAddress, mockUserAgent);

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('logLogout', () => {
    it('should log logout event', async () => {
      const { db } = await import('@/libs/DB');

      await logLogout(mockTenantId, mockUserId, mockIpAddress, mockUserAgent);

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('logRegister', () => {
    it('should log user registration', async () => {
      const { db } = await import('@/libs/DB');

      await logRegister(mockTenantId, mockUserId, mockIpAddress, mockUserAgent);

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('AuthEventType validation', () => {
    it('should accept all valid event types', async () => {
      const { db } = await import('@/libs/DB');

      const validEventTypes: AuthEventType[] = [
        'login_success',
        'login_failed',
        'logout',
        'register',
        'password_reset',
        'mfa_enabled',
        'mfa_disabled',
        'account_locked',
        'account_unlocked',
      ];

      for (const eventType of validEventTypes) {
        await logAuthEvent({
          tenantId: mockTenantId,
          userId: mockUserId,
          eventType,
          ipAddress: mockIpAddress,
          userAgent: mockUserAgent,
        });
      }

      expect(db.insert).toHaveBeenCalledTimes(validEventTypes.length);
    });
  });
});
