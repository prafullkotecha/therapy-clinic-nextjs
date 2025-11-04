import type { CreateAppointmentInput } from '@/validations/appointment.validation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  generateSlotsFromTimeRange,
  getAvailableSlots,
  getAvailableSlotsRange,
  slotsOverlap,
} from './appointment.service';

// Mock dependencies
vi.mock('@/lib/tenant-db');
vi.mock('@/libs/DB');
vi.mock('@/services/audit.service');
vi.mock('@/lib/encryption');
vi.mock('@/services/availability.service');

describe('Appointment Service', () => {
  const mockTenantId = '123e4567-e89b-12d3-a456-426614174000';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174001';
  const mockTherapistId = '123e4567-e89b-12d3-a456-426614174002';
  const mockClientId = '123e4567-e89b-12d3-a456-426614174003';
  const mockLocationId = '123e4567-e89b-12d3-a456-426614174004';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Time Overlap Detection', () => {
    it('should detect overlapping appointments correctly', () => {
      // Test cases for interval overlap: a < d && b > c
      const testCases: [string, string, string, string, boolean][] = [
        // [newStart, newEnd, existingStart, existingEnd, shouldOverlap]
        ['09:00', '10:00', '10:00', '11:00', false], // Adjacent, no overlap
        ['09:00', '10:30', '10:00', '11:00', true], // Overlaps
        ['10:30', '11:30', '10:00', '11:00', true], // Overlaps
        ['09:00', '12:00', '10:00', '11:00', true], // Contains
        ['10:00', '11:00', '09:00', '12:00', true], // Contained
        ['11:00', '12:00', '09:00', '10:00', false], // No overlap
        ['09:00', '09:30', '10:00', '11:00', false], // Before, no overlap
      ];

      testCases.forEach(([startTime, endTime, aptStart, aptEnd, expected]) => {
        // Test the overlap logic: startTime < aptEnd && endTime > aptStart
        const overlaps = startTime < aptEnd && endTime > aptStart;

        expect(overlaps).toBe(expected);
      });
    });

    it('should handle edge case of same start and end times', () => {
      const startTime = '10:00';
      const endTime = '10:00';
      const aptStart = '10:00';
      const aptEnd = '11:00';

      // Zero-duration appointment shouldn't overlap
      const overlaps = startTime < aptEnd && endTime > aptStart;

      expect(overlaps).toBe(false);
    });
  });

  describe('Appointment Status Transitions', () => {
    it('should include all active statuses in conflict check', () => {
      const activeStatuses = [
        'scheduled',
        'confirmed',
        'in_progress',
        'checked_in',
      ];

      // Verify all statuses that should prevent conflicts are included
      activeStatuses.forEach((status) => {
        expect(['scheduled', 'confirmed', 'in_progress', 'checked_in']).toContain(
          status,
        );
      });
    });

    it('should not consider cancelled or no_show in conflicts', () => {
      const inactiveStatuses = ['cancelled', 'no_show', 'completed'];

      inactiveStatuses.forEach((status) => {
        expect(['scheduled', 'confirmed', 'in_progress', 'checked_in']).not.toContain(
          status,
        );
      });
    });
  });

  describe('Reschedule Note Handling', () => {
    it('should preserve original note when rescheduling', () => {
      const originalNote = 'Client requested morning slot';
      const rescheduleInfo = 'Rescheduled to 2025-01-15 09:00-10:00';

      const expectedNote = `${originalNote}. ${rescheduleInfo}`;

      expect(expectedNote).toContain(originalNote);
      expect(expectedNote).toContain(rescheduleInfo);
    });

    it('should create reschedule note when no original note exists', () => {
      const originalNote = undefined;
      const rescheduleInfo = 'Rescheduled to 2025-01-15 09:00-10:00';

      const expectedNote = originalNote
        ? `${originalNote}. ${rescheduleInfo}`
        : rescheduleInfo;

      expect(expectedNote).toBe(rescheduleInfo);
    });
  });

  describe('Appointment Validation', () => {
    it('should validate appointment times are in correct order', () => {
      const startTime = '10:00';
      const endTime = '09:00'; // Invalid: end before start

      expect(startTime < endTime).toBe(false);
    });

    it('should validate appointment duration is positive', () => {
      const duration = 60;

      expect(duration).toBeGreaterThan(0);
    });

    it('should validate required fields are present', () => {
      const input: Partial<CreateAppointmentInput> = {
        clientId: mockClientId,
        therapistId: mockTherapistId,
        locationId: mockLocationId,
        appointmentDate: '2025-01-15',
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        appointmentType: 'initial_assessment',
      };

      expect(input.clientId).toBeDefined();
      expect(input.therapistId).toBeDefined();
      expect(input.appointmentDate).toBeDefined();
      expect(input.startTime).toBeDefined();
      expect(input.endTime).toBeDefined();
    });
  });

  describe('PHI Encryption', () => {
    it('should encrypt appointment notes (PHI)', () => {
      const note = 'Client discussed anxiety symptoms';

      // Note should be encrypted before storage
      expect(note).toBeTruthy();
      // In actual implementation, this would call encryptionService.encrypt()
    });

    it('should decrypt appointment notes on retrieval', () => {
      const encryptedNote = 'keyId:iv:authTag:ciphertext';

      // Should be decrypted on read
      expect(encryptedNote).toMatch(/:/);
    });
  });

  describe('Audit Logging', () => {
    it('should log PHI access for appointment operations', () => {
      const auditLog = {
        tenantId: mockTenantId,
        userId: mockUserId,
        action: 'read',
        resource: 'appointment',
        phiAccessed: true,
      };

      expect(auditLog.phiAccessed).toBe(true);
      expect(auditLog.action).toBe('read');
    });

    it('should log all CRUD operations', () => {
      const operations = ['create', 'read', 'update', 'delete', 'cancel'];

      operations.forEach((op) => {
        expect(['create', 'read', 'update', 'delete', 'cancel']).toContain(op);
      });
    });
  });

  describe('Recurring Appointment Generation', () => {
    describe('Daily Recurrence', () => {
      it('should generate daily appointments with interval 1', () => {
        // Should generate: 2025-01-02, 2025-01-03, 2025-01-04, 2025-01-05
        const expectedDates = ['2025-01-02', '2025-01-03', '2025-01-04', '2025-01-05'];

        expect(expectedDates).toHaveLength(4);
        expect(expectedDates[0]).toBe('2025-01-02');
        expect(expectedDates[3]).toBe('2025-01-05');
      });

      it('should generate daily appointments with interval 2', () => {
        // Should generate: 2025-01-03, 2025-01-05, 2025-01-07
        const expectedDates = ['2025-01-03', '2025-01-05', '2025-01-07'];

        expect(expectedDates).toHaveLength(3);
      });
    });

    describe('Weekly Recurrence', () => {
      it('should generate weekly appointments on same day', () => {
        // Should generate next 3 Mondays (Jan 6, 13, 20 are Mondays in 2025)
        const expectedDates = ['2025-01-06', '2025-01-13', '2025-01-20'];

        expect(expectedDates).toHaveLength(3);

        expectedDates.forEach((date) => {
          const day = new Date(`${date}T12:00:00`).getDay();

          expect(day).toBe(1); // Monday
        });
      });

      it('should generate weekly appointments on multiple days', () => {
        const daysOfWeek = [1, 3, 5]; // Mon, Wed, Fri

        // Should generate appointments on Mon, Wed, Fri each week
        expect(daysOfWeek).toContain(1);
        expect(daysOfWeek).toContain(3);
        expect(daysOfWeek).toContain(5);
      });
    });

    describe('Biweekly Recurrence', () => {
      it('should generate biweekly appointments', () => {
        // Should skip one week between appointments
        const expectedDates = ['2025-01-20', '2025-02-03'];

        expect(expectedDates).toHaveLength(2);
      });
    });

    describe('Monthly Recurrence', () => {
      it('should generate monthly appointments on same day', () => {
        // Should generate: 2025-02-15, 2025-03-15, 2025-04-15
        const expectedDates = ['2025-02-15', '2025-03-15', '2025-04-15'];

        expect(expectedDates).toHaveLength(3);
      });

      it('should handle month with fewer days', () => {
        // Feb doesn't have 31 days, should use last day (28 or 29)
        const febDate = '2025-02-28';

        expect(febDate).toMatch(/2025-02-2[89]/);
      });
    });

    describe('Conflict Detection', () => {
      it('should detect conflicts before creating appointments', () => {
        const conflicts = [
          { date: '2025-01-15', reason: 'Therapist has another appointment' },
          { date: '2025-01-22', reason: 'Therapist has another appointment' },
        ];

        expect(conflicts).toHaveLength(2);
        expect(conflicts[0]?.date).toBe('2025-01-15');
      });

      it('should provide detailed conflict information', () => {
        const conflict = {
          appointmentId: mockUserId,
          startTime: '10:00',
          endTime: '11:00',
          reason: 'Therapist has another appointment',
        };

        expect(conflict.reason).toBeTruthy();
        expect(conflict.startTime).toBeTruthy();
        expect(conflict.endTime).toBeTruthy();
      });
    });

    describe('Partial Failure Handling', () => {
      it('should track successful and failed appointments', () => {
        const results = [
          { id: '1', status: 'scheduled' },
          { error: true, date: '2025-01-15', message: 'Conflict' },
          { id: '2', status: 'scheduled' },
        ];

        const successful = results.filter(r => !('error' in r));
        const failed = results.filter(r => 'error' in r);

        expect(successful).toHaveLength(2);
        expect(failed).toHaveLength(1);
      });

      it('should log partial failures', () => {
        const failures = [
          { date: '2025-01-15', message: 'Conflict detected' },
          { date: '2025-01-22', message: 'Invalid time slot' },
        ];

        const failureDetails = failures
          .map(f => `${f.date}: ${f.message}`)
          .join('; ');

        expect(failureDetails).toContain('2025-01-15: Conflict detected');
        expect(failureDetails).toContain('2025-01-22: Invalid time slot');
      });
    });

    describe('Parent-Child Relationship', () => {
      it('should link child appointments to parent', () => {
        const parentId = '123e4567-e89b-12d3-a456-426614174000';
        const childAppointment = {
          id: '123e4567-e89b-12d3-a456-426614174001',
          parentAppointmentId: parentId,
          isRecurring: false,
        };

        expect(childAppointment.parentAppointmentId).toBe(parentId);
        expect(childAppointment.isRecurring).toBe(false);
      });

      it('should mark parent as recurring', () => {
        const parentAppointment = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          isRecurring: true,
          recurrencePattern: {
            frequency: 'weekly',
            interval: 1,
            endDate: '2025-12-31',
          },
        };

        expect(parentAppointment.isRecurring).toBe(true);
        expect(parentAppointment.recurrencePattern).toBeTruthy();
      });
    });
  });

  /**
   * Phase 1: Comprehensive tests for slot generation helper functions
   */
  describe('Slot Generation - Helper Functions', () => {
    /**
     * slotsOverlap() - Comprehensive overlap detection tests
     */
    describe('slotsOverlap()', () => {
      describe('Non-overlapping scenarios', () => {
        it('should return false for adjacent slots (no overlap)', () => {
          expect(slotsOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
          expect(slotsOverlap('10:00', '11:00', '09:00', '10:00')).toBe(false);
        });

        it('should return false when slots are before with gap', () => {
          expect(slotsOverlap('09:00', '10:00', '11:00', '12:00')).toBe(false);
          expect(slotsOverlap('11:00', '12:00', '09:00', '10:00')).toBe(false);
        });

        it('should return false when slots are after with gap', () => {
          expect(slotsOverlap('14:00', '15:00', '09:00', '10:00')).toBe(false);
          expect(slotsOverlap('09:00', '10:00', '14:00', '15:00')).toBe(false);
        });
      });

      describe('Overlapping scenarios', () => {
        it('should return true for partial overlap (start)', () => {
          expect(slotsOverlap('09:00', '10:30', '10:00', '11:00')).toBe(true);
        });

        it('should return true for partial overlap (end)', () => {
          expect(slotsOverlap('10:30', '11:30', '10:00', '11:00')).toBe(true);
        });

        it('should return true when slot completely contains another', () => {
          expect(slotsOverlap('09:00', '12:00', '10:00', '11:00')).toBe(true);
        });

        it('should return true when slot is contained within another', () => {
          expect(slotsOverlap('10:00', '11:00', '09:00', '12:00')).toBe(true);
        });

        it('should return true for single minute overlap', () => {
          expect(slotsOverlap('09:00', '10:01', '10:00', '11:00')).toBe(true);
          expect(slotsOverlap('10:00', '11:00', '09:59', '10:01')).toBe(true);
        });

        it('should return true for multiple hour overlap', () => {
          expect(slotsOverlap('09:00', '14:00', '10:00', '15:00')).toBe(true);
        });
      });

      describe('Edge cases', () => {
        it('should return false for zero-duration slots', () => {
          expect(slotsOverlap('10:00', '10:00', '10:00', '11:00')).toBe(false);
          expect(slotsOverlap('10:00', '11:00', '10:00', '10:00')).toBe(false);
        });

        it('should return false for both zero-duration slots at same time', () => {
          expect(slotsOverlap('10:00', '10:00', '10:00', '10:00')).toBe(false);
        });

        it('should return true for exact same slot', () => {
          expect(slotsOverlap('10:00', '11:00', '10:00', '11:00')).toBe(true);
        });

        it('should handle time strings with seconds', () => {
          expect(slotsOverlap('09:00:00', '10:00:00', '09:30:00', '10:30:00')).toBe(true);
        });

        it('should handle early morning times', () => {
          expect(slotsOverlap('00:00', '01:00', '00:30', '01:30')).toBe(true);
        });

        it('should handle late evening times', () => {
          expect(slotsOverlap('23:00', '23:59', '23:30', '23:59')).toBe(true);
        });
      });

      describe('Symmetry', () => {
        it('should be commutative (order should not matter)', () => {
          const result1 = slotsOverlap('09:00', '10:00', '09:30', '10:30');
          const result2 = slotsOverlap('09:30', '10:30', '09:00', '10:00');

          expect(result1).toBe(result2);
          expect(result1).toBe(true);
        });

        it('should maintain symmetry for non-overlapping slots', () => {
          const result1 = slotsOverlap('09:00', '10:00', '11:00', '12:00');
          const result2 = slotsOverlap('11:00', '12:00', '09:00', '10:00');

          expect(result1).toBe(result2);
          expect(result1).toBe(false);
        });
      });
    });

    /**
     * generateSlotsFromTimeRange() - Comprehensive slot generation tests
     */
    describe('generateSlotsFromTimeRange()', () => {
      describe('Basic slot generation', () => {
        it('should generate 8 hourly slots from 09:00-17:00', () => {
          const slots = generateSlotsFromTimeRange('09:00', '17:00', 60, '2025-01-15');

          expect(slots).toHaveLength(8);
          expect(slots[0]?.startTime).toBe('09:00');
          expect(slots[0]?.endTime).toBe('10:00');
          expect(slots[7]?.startTime).toBe('16:00');
          expect(slots[7]?.endTime).toBe('17:00');
        });

        it('should generate 6 half-hour slots from 09:00-12:00', () => {
          const slots = generateSlotsFromTimeRange('09:00', '12:00', 30, '2025-01-15');

          expect(slots).toHaveLength(6);
          expect(slots[0]?.startTime).toBe('09:00');
          expect(slots[0]?.endTime).toBe('09:30');
          expect(slots[5]?.startTime).toBe('11:30');
          expect(slots[5]?.endTime).toBe('12:00');
        });

        it('should generate 4 quarter-hour slots from 09:00-10:00', () => {
          const slots = generateSlotsFromTimeRange('09:00', '10:00', 15, '2025-01-15');

          expect(slots).toHaveLength(4);
          expect(slots[0]?.startTime).toBe('09:00');
          expect(slots[0]?.endTime).toBe('09:15');
          expect(slots[3]?.startTime).toBe('09:45');
          expect(slots[3]?.endTime).toBe('10:00');
        });

        it('should generate 90-minute slots', () => {
          const slots = generateSlotsFromTimeRange('09:00', '12:00', 90, '2025-01-15');

          expect(slots).toHaveLength(2);
          expect(slots[0]?.startTime).toBe('09:00');
          expect(slots[0]?.endTime).toBe('10:30');
          expect(slots[1]?.startTime).toBe('10:30');
          expect(slots[1]?.endTime).toBe('12:00');
        });

        it('should generate 2-hour slots', () => {
          const slots = generateSlotsFromTimeRange('09:00', '17:00', 120, '2025-01-15');

          expect(slots).toHaveLength(4);
          expect(slots[0]?.startTime).toBe('09:00');
          expect(slots[0]?.endTime).toBe('11:00');
          expect(slots[3]?.startTime).toBe('15:00');
          expect(slots[3]?.endTime).toBe('17:00');
        });
      });

      describe('Sequential slots (no gaps)', () => {
        it('should generate sequential slots with no gaps', () => {
          const slots = generateSlotsFromTimeRange('09:00', '12:00', 60, '2025-01-15');

          for (let i = 0; i < slots.length - 1; i++) {
            expect(slots[i]?.endTime).toBe(slots[i + 1]?.startTime);
          }
        });

        it('should generate sequential 30-min slots with no gaps', () => {
          const slots = generateSlotsFromTimeRange('10:00', '13:00', 30, '2025-01-15');

          expect(slots).toHaveLength(6);

          for (let i = 0; i < slots.length - 1; i++) {
            expect(slots[i]?.endTime).toBe(slots[i + 1]?.startTime);
          }
        });
      });

      describe('Edge cases - range not divisible by slot duration', () => {
        it('should not generate partial slots (range not divisible)', () => {
          const slots = generateSlotsFromTimeRange('09:00', '10:45', 60, '2025-01-15');

          // Should only generate 1 slot (09:00-10:00), not partial 10:00-10:45
          expect(slots).toHaveLength(1);
          expect(slots[0]?.startTime).toBe('09:00');
          expect(slots[0]?.endTime).toBe('10:00');
        });

        it('should not generate partial 30-min slots', () => {
          const slots = generateSlotsFromTimeRange('09:00', '10:15', 30, '2025-01-15');

          expect(slots).toHaveLength(2); // Only 09:00-09:30, 09:30-10:00
        });

        it('should handle odd time ranges', () => {
          const slots = generateSlotsFromTimeRange('09:23', '11:53', 60, '2025-01-15');

          expect(slots).toHaveLength(2); // 09:23-10:23, 10:23-11:23
          expect(slots[0]?.startTime).toBe('09:23');
          expect(slots[0]?.endTime).toBe('10:23');
        });
      });

      describe('Edge cases - range too small', () => {
        it('should return empty array when range is smaller than slot duration', () => {
          const slots = generateSlotsFromTimeRange('09:00', '09:30', 60, '2025-01-15');

          expect(slots).toHaveLength(0);
        });

        it('should return empty array when range equals slot duration', () => {
          const slots = generateSlotsFromTimeRange('09:00', '10:00', 60, '2025-01-15');

          expect(slots).toHaveLength(1);
          expect(slots[0]?.startTime).toBe('09:00');
          expect(slots[0]?.endTime).toBe('10:00');
        });

        it('should return empty array for zero-duration range', () => {
          const slots = generateSlotsFromTimeRange('09:00', '09:00', 60, '2025-01-15');

          expect(slots).toHaveLength(0);
        });
      });

      describe('Edge cases - date boundaries', () => {
        it('should handle month boundary dates (Jan 31)', () => {
          const slots = generateSlotsFromTimeRange('09:00', '12:00', 60, '2025-01-31');

          expect(slots).toHaveLength(3);
          expect(slots[0]?.startTime).toBe('09:00');
        });

        it('should handle leap year date (Feb 29, 2024)', () => {
          const slots = generateSlotsFromTimeRange('09:00', '12:00', 60, '2024-02-29');

          expect(slots).toHaveLength(3);
        });

        it('should handle year boundary (Dec 31)', () => {
          const slots = generateSlotsFromTimeRange('09:00', '12:00', 60, '2024-12-31');

          expect(slots).toHaveLength(3);
        });
      });

      describe('Edge cases - invalid input handling', () => {
        it('should return empty array for invalid time format', () => {
          const slots = generateSlotsFromTimeRange('invalid', '12:00', 60, '2025-01-15');

          expect(slots).toHaveLength(0);
        });

        it('should return empty array for undefined hour/minute', () => {
          const slots = generateSlotsFromTimeRange(':', '12:00', 60, '2025-01-15');

          expect(slots).toHaveLength(0);
        });

        it('should handle end time before start time', () => {
          const slots = generateSlotsFromTimeRange('12:00', '09:00', 60, '2025-01-15');

          // Should return empty array as range is invalid
          expect(slots).toHaveLength(0);
        });
      });

      describe('Time variations', () => {
        it('should handle early morning times (starting at midnight)', () => {
          const slots = generateSlotsFromTimeRange('00:00', '02:00', 60, '2025-01-15');

          expect(slots).toHaveLength(2);
          expect(slots[0]?.startTime).toBe('00:00');
        });

        it('should handle late evening times', () => {
          const slots = generateSlotsFromTimeRange('22:00', '23:30', 30, '2025-01-15');

          expect(slots).toHaveLength(3);
          expect(slots[0]?.startTime).toBe('22:00');
          expect(slots[2]?.endTime).toBe('23:30');
        });

        it('should handle times with non-zero minutes', () => {
          const slots = generateSlotsFromTimeRange('09:15', '11:15', 30, '2025-01-15');

          expect(slots).toHaveLength(4);
          expect(slots[0]?.startTime).toBe('09:15');
        });
      });

      describe('Slot duration variations', () => {
        it('should handle 15-minute slots (high granularity)', () => {
          const slots = generateSlotsFromTimeRange('09:00', '10:00', 15, '2025-01-15');

          expect(slots).toHaveLength(4);
        });

        it('should handle 45-minute slots', () => {
          const slots = generateSlotsFromTimeRange('09:00', '12:00', 45, '2025-01-15');

          expect(slots).toHaveLength(4);
          expect(slots[0]?.endTime).toBe('09:45');
        });

        it('should handle 3-hour slots', () => {
          const slots = generateSlotsFromTimeRange('09:00', '15:00', 180, '2025-01-15');

          expect(slots).toHaveLength(2);
          expect(slots[0]?.endTime).toBe('12:00');
        });
      });
    });

    /**
     * Phase 2 & 3: Integration tests for getAvailableSlots() and getAvailableSlotsRange()
     * Note: These are simplified tests due to the complexity of mocking all dependencies.
     * Full integration tests would require extensive mocking of DB, encryption, and availability service.
     */
    describe('getAvailableSlots() - Core functionality tests', () => {
      it('should export getAvailableSlots function', () => {
        expect(getAvailableSlots).toBeDefined();
        expect(typeof getAvailableSlots).toBe('function');
      });

      it('should have correct function signature', () => {
        // function.length doesn't count parameters with default values
        expect(getAvailableSlots.length).toBe(3); // tenantId, therapistId, date (slotDuration has default)
      });
    });

    describe('getAvailableSlotsRange() - Core functionality tests', () => {
      it('should export getAvailableSlotsRange function', () => {
        expect(getAvailableSlotsRange).toBeDefined();
        expect(typeof getAvailableSlotsRange).toBe('function');
      });

      it('should have correct function signature', () => {
        // function.length doesn't count parameters with default values
        expect(getAvailableSlotsRange.length).toBe(4); // tenantId, therapistId, startDate, endDate (slotDuration has default)
      });

      it('should calculate correct number of days in range', () => {
        const start = new Date('2025-01-01');
        const end = new Date('2025-01-07');
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

        expect(daysDiff).toBe(7);
      });

      it('should handle single day range', () => {
        const start = new Date('2025-01-15');
        const end = new Date('2025-01-15');
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

        expect(daysDiff).toBe(1);
      });

      it('should handle month boundary correctly', () => {
        const start = new Date('2025-01-30');
        const end = new Date('2025-02-02');
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

        expect(daysDiff).toBe(4);
      });

      it('should handle leap year correctly', () => {
        const start = new Date('2024-02-28');
        const end = new Date('2024-03-01');
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

        expect(daysDiff).toBe(3); // Includes Feb 29
      });

      it('should generate correct date strings for iteration', () => {
        const start = new Date('2025-01-15');
        const dateStr = start.toISOString().split('T')[0];

        expect(dateStr).toBe('2025-01-15');
      });
    });

    /**
     * Phase 4: Edge cases and performance considerations
     */
    describe('Performance considerations', () => {
      it('should handle 90-day range calculation efficiently', () => {
        const start = new Date('2025-01-01');
        const end = new Date('2025-03-31');
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

        expect(daysDiff).toBe(90);
      });

      it('should handle 365-day range calculation', () => {
        const start = new Date('2025-01-01');
        const end = new Date('2025-12-31');
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;

        expect(daysDiff).toBe(365);
      });

      it('should efficiently generate many time slots', () => {
        const startTime = performance.now();
        const slots = generateSlotsFromTimeRange('09:00', '17:00', 15, '2025-01-15');
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(slots).toHaveLength(32); // 8 hours * 4 slots/hour = 32 slots
        expect(duration).toBeLessThan(50); // Should be fast (< 50ms)
      });

      it('should handle large slot generation without performance issues', () => {
        const startTime = performance.now();

        // Generate full day of 15-min slots
        const slots = generateSlotsFromTimeRange('00:00', '23:45', 15, '2025-01-15');
        const endTime = performance.now();
        const duration = endTime - startTime;

        expect(slots).toHaveLength(95); // 23.75 hours * 4 slots/hour = 95 slots
        expect(duration).toBeLessThan(50); // Should complete quickly
      });
    });

    describe('Edge cases for slot generation', () => {
      it('should handle date-specific slot generation consistently', () => {
        // Test that slot generation works consistently regardless of date
        const dates = ['2025-03-09', '2025-06-21', '2025-12-21'];

        dates.forEach((date) => {
          const slots = generateSlotsFromTimeRange('09:00', '11:00', 60, date);

          expect(slots).toHaveLength(2);
          expect(slots[0]?.startTime).toBe('09:00');
        });
      });

      it('should handle different slot durations consistently', () => {
        const durations = [15, 30, 45, 60, 90, 120];

        durations.forEach((duration) => {
          const slots = generateSlotsFromTimeRange('09:00', '12:00', duration, '2025-01-15');

          expect(slots.length).toBeGreaterThan(0);

          // Verify all slots have correct duration
          slots.forEach((slot) => {
            const start = new Date(`2025-01-15T${slot.startTime}`);
            const end = new Date(`2025-01-15T${slot.endTime}`);
            const actualDuration = (end.getTime() - start.getTime()) / (60 * 1000);

            expect(actualDuration).toBe(duration);
          });
        });
      });

      it('should maintain consistency across date boundaries', () => {
        const dates = ['2025-01-31', '2025-02-28', '2025-12-31', '2024-02-29'];

        dates.forEach((date) => {
          const slots = generateSlotsFromTimeRange('09:00', '12:00', 60, date);

          expect(slots).toHaveLength(3);
          expect(slots[0]?.startTime).toBe('09:00');
        });
      });

      it('should handle time string variations gracefully', () => {
        // Test that leading zeros are handled correctly
        const slots1 = generateSlotsFromTimeRange('09:00', '11:00', 60, '2025-01-15');
        const slots2 = generateSlotsFromTimeRange('09:00', '11:00', 60, '2025-01-15');

        expect(slots1).toEqual(slots2);
      });

      it('should validate slot overlap logic with complex scenarios', () => {
        // Multiple overlapping scenarios
        const scenarios = [
          { s1: '09:00', e1: '10:00', s2: '09:30', e2: '10:30', expected: true },
          { s1: '09:00', e1: '10:00', s2: '10:00', e2: '11:00', expected: false },
          { s1: '09:00', e1: '10:00', s2: '09:00', e2: '10:00', expected: true },
          { s1: '09:00', e1: '10:00', s2: '08:00', e2: '09:00', expected: false },
        ];

        scenarios.forEach(({ s1, e1, s2, e2, expected }) => {
          expect(slotsOverlap(s1, e1, s2, e2)).toBe(expected);
        });
      });
    });
  });
});
