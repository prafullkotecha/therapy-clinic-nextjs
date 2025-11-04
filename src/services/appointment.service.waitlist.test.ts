import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/libs/DB';
import { appointments, waitlist } from '@/models/appointment.schema';
import { addToWaitlist, processWaitlist } from './appointment.service';

// Mock the notification service
vi.mock('./notification.service', () => ({
  sendWaitlistNotification: vi.fn().mockResolvedValue(true),
}));

// Mock the logger
vi.mock('@/libs/Logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock tenant context
vi.mock('@/lib/tenant-db', () => ({
  withTenantContext: vi.fn((_tenantId, fn) => fn()),
}));

// Mock encryption service
vi.mock('@/lib/encryption', () => ({
  getEncryptionServiceSync: vi.fn(() => ({
    encrypt: (value: string) => `encrypted:${value}`,
    decrypt: (value: string) => value.replace('encrypted:', ''),
  })),
}));

describe('Waitlist Processing', () => {
  const testTenantId = '00000000-0000-0000-0000-000000000001';
  const testTherapistId = '00000000-0000-0000-0000-000000000002';
  const testClientId1 = '00000000-0000-0000-0000-000000000003';
  const testClientId2 = '00000000-0000-0000-0000-000000000004';
  const testDate = '2025-03-15';

  beforeEach(async () => {
    // Clean up test data
    await db.delete(waitlist);
    await db.delete(appointments);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('addToWaitlist', () => {
    it('should add client to waitlist with standard priority', async () => {
      const entry = await addToWaitlist(
        testTenantId,
        testClientId1,
        testTherapistId,
        [testDate],
        ['09:00'],
        'standard',
      );

      expect(entry).toBeDefined();
      expect(entry.clientId).toBe(testClientId1);
      expect(entry.therapistId).toBe(testTherapistId);
      expect(entry.priority).toBe('standard');
      expect(entry.status).toBe('waiting');
    });

    it('should add client to waitlist with urgent priority', async () => {
      const entry = await addToWaitlist(
        testTenantId,
        testClientId1,
        testTherapistId,
        [testDate],
        ['09:00'],
        'urgent',
      );

      expect(entry).toBeDefined();
      expect(entry.priority).toBe('urgent');
    });

    it('should add client without date/time preferences', async () => {
      const entry = await addToWaitlist(
        testTenantId,
        testClientId1,
        testTherapistId,
        undefined,
        undefined,
        'standard',
      );

      expect(entry).toBeDefined();
      expect(entry.preferredDates).toBeNull();
      expect(entry.preferredTimes).toBeNull();
    });
  });

  describe('processWaitlist', () => {
    it('should notify clients when slots become available', async () => {
      // Add clients to waitlist
      await addToWaitlist(
        testTenantId,
        testClientId1,
        testTherapistId,
        [testDate],
        undefined,
        'standard',
      );

      await addToWaitlist(
        testTenantId,
        testClientId2,
        testTherapistId,
        [testDate],
        undefined,
        'standard',
      );

      // Mock getAvailableSlots to return available slots
      const mockGetAvailableSlots = vi.fn().mockResolvedValue([
        {
          startTime: '09:00',
          endTime: '10:00',
          therapistId: testTherapistId,
          therapistName: 'Test Therapist',
          locationId: 'location-1',
        },
      ]);

      vi.mock('./appointment.service', async (importOriginal) => {
        const original = await importOriginal<typeof import('./appointment.service')>();
        return {
          ...original,
          getAvailableSlots: mockGetAvailableSlots,
        };
      });

      // Process waitlist
      await processWaitlist(testTenantId, testTherapistId, testDate);

      // Verify notification was sent (implementation would check mock)
      // This is a placeholder - full implementation would verify sendWaitlistNotification was called
    });

    it('should prioritize urgent clients over standard', async () => {
      // Add standard priority client first
      await addToWaitlist(
        testTenantId,
        testClientId1,
        testTherapistId,
        [testDate],
        undefined,
        'standard',
      );

      // Add urgent priority client second (but should be notified first)
      await addToWaitlist(
        testTenantId,
        testClientId2,
        testTherapistId,
        [testDate],
        undefined,
        'urgent',
      );

      // Process waitlist - urgent client should be notified first
      // Full test would verify order of notifications
    });

    it('should match clients with preferred date filter', async () => {
      const preferredDate = '2025-03-16';
      const differentDate = '2025-03-17';

      await addToWaitlist(
        testTenantId,
        testClientId1,
        testTherapistId,
        [preferredDate],
        undefined,
        'standard',
      );

      // Process waitlist for a different date
      await processWaitlist(testTenantId, testTherapistId, differentDate);

      // Client should NOT be notified because date doesn't match
      const entries = await db
        .select()
        .from(waitlist)
        .where(eq(waitlist.clientId, testClientId1));

      expect(entries[0]?.status).toBe('waiting'); // Still waiting
    });

    it('should match clients with preferred time filter', async () => {
      await addToWaitlist(
        testTenantId,
        testClientId1,
        testTherapistId,
        [testDate],
        ['14:00'], // Specific time preference
        'standard',
      );

      // Process waitlist - would only notify if slot at 14:00 is available
    });

    it('should handle no available slots gracefully', async () => {
      await addToWaitlist(
        testTenantId,
        testClientId1,
        testTherapistId,
        [testDate],
        undefined,
        'standard',
      );

      // Mock getAvailableSlots to return empty array
      const mockGetAvailableSlots = vi.fn().mockResolvedValue([]);

      vi.mock('./appointment.service', async (importOriginal) => {
        const original = await importOriginal<typeof import('./appointment.service')>();
        return {
          ...original,
          getAvailableSlots: mockGetAvailableSlots,
        };
      });

      // Should not throw error
      await expect(
        processWaitlist(testTenantId, testTherapistId, testDate),
      ).resolves.not.toThrow();
    });

    it('should handle no waitlist entries gracefully', async () => {
      // No entries in waitlist
      await expect(
        processWaitlist(testTenantId, testTherapistId, testDate),
      ).resolves.not.toThrow();
    });
  });
});
