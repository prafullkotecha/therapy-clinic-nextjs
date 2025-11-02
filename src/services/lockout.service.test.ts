/**
 * Tests for Account Lockout Service
 *
 * Tests the lockout tracking, account locking, and auto-unlock functionality.
 */

import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/libs/DB';
import { failedLoginAttempts, users } from '@/models/user.schema';
import * as auditService from './audit.service';
import {
  checkAndLockAccount,
  cleanupExpiredAttempts,
  clearFailedAttempts,
  getRecentFailedAttempts,
  isAccountLocked,
  recordFailedLoginAttempt,
  unlockAccount,
} from './lockout.service';

// Mock audit service
vi.mock('./audit.service', () => ({
  logAccountLocked: vi.fn(),
  logAccountUnlocked: vi.fn(),
}));

describe('Lockout Service', () => {
  const mockTenantId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '223e4567-e89b-12d3-a456-426614174000';
  const mockEmail = 'test@example.com';
  const mockIp = '192.168.1.1';
  const mockUserAgent = 'Mozilla/5.0';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Cleanup test data
    await db.delete(failedLoginAttempts);
  });

  describe('recordFailedLoginAttempt', () => {
    it('should record failed login attempt', async () => {
      await recordFailedLoginAttempt(
        mockTenantId,
        mockEmail,
        'email',
        mockIp,
        mockUserAgent,
        'invalid_credentials',
      );

      const attempts = await db
        .select()
        .from(failedLoginAttempts)
        .where(eq(failedLoginAttempts.identifier, mockEmail));

      expect(attempts).toHaveLength(1);
      expect(attempts[0]?.identifier).toBe(mockEmail);
      expect(attempts[0]?.identifierType).toBe('email');
      expect(attempts[0]?.ipAddress).toBe(mockIp);
      expect(attempts[0]?.failureReason).toBe('invalid_credentials');
    });

    it('should set expiration time correctly', async () => {
      const beforeTime = new Date();
      beforeTime.setMinutes(beforeTime.getMinutes() + 15);

      await recordFailedLoginAttempt(
        mockTenantId,
        mockEmail,
        'email',
        mockIp,
        mockUserAgent,
      );

      const attempts = await db
        .select()
        .from(failedLoginAttempts)
        .where(eq(failedLoginAttempts.identifier, mockEmail));

      const afterTime = new Date();
      afterTime.setMinutes(afterTime.getMinutes() + 15);

      expect(attempts[0]?.expiresAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(attempts[0]?.expiresAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('getRecentFailedAttempts', () => {
    it('should count recent failed attempts', async () => {
      // Record 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await recordFailedLoginAttempt(
          mockTenantId,
          mockEmail,
          'email',
          mockIp,
          mockUserAgent,
        );
      }

      const count = await getRecentFailedAttempts(mockTenantId, mockEmail);

      expect(count).toBe(3);
    });

    it('should not count expired attempts', async () => {
      // Record an attempt with past expiration
      const pastExpiration = new Date();
      pastExpiration.setMinutes(pastExpiration.getMinutes() - 20);

      await db.insert(failedLoginAttempts).values({
        tenantId: mockTenantId,
        identifier: mockEmail,
        identifierType: 'email',
        ipAddress: mockIp,
        userAgent: mockUserAgent,
        attemptedAt: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
        expiresAt: pastExpiration,
      });

      const count = await getRecentFailedAttempts(mockTenantId, mockEmail);

      expect(count).toBe(0);
    });
  });

  describe('checkAndLockAccount', () => {
    it('should lock account after 5 failed attempts', async () => {
      // Create a user first
      await db.insert(users).values({
        id: mockUserId,
        tenantId: mockTenantId,
        keycloakId: 'keycloak-123',
        email: mockEmail,
        role: 'therapist',
        isLocked: false,
      });

      // Record 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await recordFailedLoginAttempt(
          mockTenantId,
          mockEmail,
          'email',
          mockIp,
          mockUserAgent,
        );
      }

      const wasLocked = await checkAndLockAccount(
        mockTenantId,
        mockEmail,
        mockIp,
        mockUserAgent,
      );

      expect(wasLocked).toBe(true);
      expect(auditService.logAccountLocked).toHaveBeenCalledWith(
        mockTenantId,
        mockUserId,
        mockIp,
        mockUserAgent,
        expect.objectContaining({
          failedAttempts: 5,
          lockoutDuration: 30,
        }),
      );

      // Verify user is locked in database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, mockUserId))
        .limit(1);

      expect(user?.isLocked).toBe(true);
    });

    it('should not lock account with fewer than 5 attempts', async () => {
      await db.insert(users).values({
        id: mockUserId,
        tenantId: mockTenantId,
        keycloakId: 'keycloak-123',
        email: mockEmail,
        role: 'therapist',
        isLocked: false,
      });

      // Record only 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await recordFailedLoginAttempt(
          mockTenantId,
          mockEmail,
          'email',
          mockIp,
          mockUserAgent,
        );
      }

      const wasLocked = await checkAndLockAccount(
        mockTenantId,
        mockEmail,
        mockIp,
        mockUserAgent,
      );

      expect(wasLocked).toBe(false);
      expect(auditService.logAccountLocked).not.toHaveBeenCalled();
    });
  });

  describe('isAccountLocked', () => {
    it('should return true for locked account', async () => {
      await db.insert(users).values({
        id: mockUserId,
        tenantId: mockTenantId,
        keycloakId: 'keycloak-123',
        email: mockEmail,
        role: 'therapist',
        isLocked: true,
      });

      const locked = await isAccountLocked(mockTenantId, mockEmail, 'email');

      expect(locked).toBe(true);
    });

    it('should return false for unlocked account', async () => {
      await db.insert(users).values({
        id: mockUserId,
        tenantId: mockTenantId,
        keycloakId: 'keycloak-123',
        email: mockEmail,
        role: 'therapist',
        isLocked: false,
      });

      const locked = await isAccountLocked(mockTenantId, mockEmail, 'email');

      expect(locked).toBe(false);
    });

    it('should return false for non-existent account', async () => {
      const locked = await isAccountLocked(mockTenantId, 'nonexistent@example.com', 'email');

      expect(locked).toBe(false);
    });
  });

  describe('unlockAccount', () => {
    it('should unlock account and clear failed attempts', async () => {
      await db.insert(users).values({
        id: mockUserId,
        tenantId: mockTenantId,
        keycloakId: 'keycloak-123',
        email: mockEmail,
        role: 'therapist',
        isLocked: true,
      });

      // Add some failed attempts
      await recordFailedLoginAttempt(
        mockTenantId,
        mockEmail,
        'email',
        mockIp,
        mockUserAgent,
      );

      await unlockAccount(mockTenantId, mockUserId, mockIp, mockUserAgent, false);

      // Verify user is unlocked
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, mockUserId))
        .limit(1);

      expect(user?.isLocked).toBe(false);

      // Verify failed attempts cleared
      const attempts = await db
        .select()
        .from(failedLoginAttempts)
        .where(eq(failedLoginAttempts.identifier, mockEmail));

      expect(attempts).toHaveLength(0);

      // Verify audit log
      expect(auditService.logAccountUnlocked).toHaveBeenCalledWith(
        mockTenantId,
        mockUserId,
        mockIp,
        mockUserAgent,
        { automatic: false },
      );
    });
  });

  describe('clearFailedAttempts', () => {
    it('should clear all failed attempts for identifier', async () => {
      // Record multiple failed attempts
      for (let i = 0; i < 3; i++) {
        await recordFailedLoginAttempt(
          mockTenantId,
          mockEmail,
          'email',
          mockIp,
          mockUserAgent,
        );
      }

      await clearFailedAttempts(mockTenantId, mockEmail);

      const attempts = await db
        .select()
        .from(failedLoginAttempts)
        .where(eq(failedLoginAttempts.identifier, mockEmail));

      expect(attempts).toHaveLength(0);
    });
  });

  describe('cleanupExpiredAttempts', () => {
    it('should delete expired attempts', async () => {
      // Insert expired attempt
      const pastExpiration = new Date();
      pastExpiration.setMinutes(pastExpiration.getMinutes() - 10);

      await db.insert(failedLoginAttempts).values({
        tenantId: mockTenantId,
        identifier: mockEmail,
        identifierType: 'email',
        ipAddress: mockIp,
        userAgent: mockUserAgent,
        expiresAt: pastExpiration,
      });

      const deletedCount = await cleanupExpiredAttempts();

      expect(deletedCount).toBe(1);

      const attempts = await db
        .select()
        .from(failedLoginAttempts)
        .where(eq(failedLoginAttempts.identifier, mockEmail));

      expect(attempts).toHaveLength(0);
    });

    it('should not delete non-expired attempts', async () => {
      await recordFailedLoginAttempt(
        mockTenantId,
        mockEmail,
        'email',
        mockIp,
        mockUserAgent,
      );

      const deletedCount = await cleanupExpiredAttempts();

      expect(deletedCount).toBe(0);

      const attempts = await db
        .select()
        .from(failedLoginAttempts)
        .where(eq(failedLoginAttempts.identifier, mockEmail));

      expect(attempts).toHaveLength(1);
    });
  });
});
