import { describe, expect, it } from 'vitest';
import { therapistAvailability } from '../availability.schema';

describe('Availability Schema', () => {
  describe('therapistAvailability table', () => {
    it('should have correct table name', () => {
      expect((therapistAvailability as any)[Symbol.for('drizzle:Name')]).toBe('therapist_availability');
    });

    it('should have all required columns', () => {
      const columns = Object.keys(therapistAvailability);
      const requiredColumns = [
        'id',
        'tenantId',
        'therapistId',
        'locationId',
        'startDate',
        'endDate',
        'startTime',
        'endTime',
        'availabilityType',
        'reason',
        'notes',
        'isRecurring',
        'recurringDays',
        'createdAt',
        'updatedAt',
      ];

      requiredColumns.forEach((col) => {
        expect(columns).toContain(col);
      });
    });

    it('should have correct primary key', () => {
      expect(therapistAvailability.id.primary).toBe(true);
    });

    it('should have tenant_id as not null', () => {
      expect(therapistAvailability.tenantId.notNull).toBe(true);
    });

    it('should have therapist_id as not null', () => {
      expect(therapistAvailability.therapistId.notNull).toBe(true);
    });

    it('should have start_date as not null', () => {
      expect(therapistAvailability.startDate.notNull).toBe(true);
    });

    it('should have end_date as not null', () => {
      expect(therapistAvailability.endDate.notNull).toBe(true);
    });

    it('should have availabilityType as not null', () => {
      expect(therapistAvailability.availabilityType.notNull).toBe(true);
    });

    it('should have correct default for isRecurring', () => {
      expect(therapistAvailability.isRecurring.default).toBe('none');
    });

    it('should have timestamps with defaults', () => {
      expect(therapistAvailability.createdAt.hasDefault).toBe(true);
      expect(therapistAvailability.createdAt.notNull).toBe(true);
      expect(therapistAvailability.updatedAt.hasDefault).toBe(true);
      expect(therapistAvailability.updatedAt.notNull).toBe(true);
    });
  });
});
