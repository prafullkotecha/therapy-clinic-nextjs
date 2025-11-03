import { describe, expect, it } from 'vitest';
import {
  CancelAppointmentSchema,
  CreateAppointmentSchema,
  RecurringAppointmentSchema,
  RescheduleAppointmentSchema,
  UpdateAppointmentSchema,
  WaitlistSchema,
} from './appointment.validation';

describe('Appointment Validation Schemas', () => {
  describe('AppointmentType validation', () => {
    it('should accept valid appointment types', () => {
      const validTypes = [
        'initial_assessment',
        'regular_session',
        'family_session',
        'group_session',
        'follow_up',
      ];

      validTypes.forEach((type) => {
        const result = CreateAppointmentSchema.shape.appointmentType.safeParse(type);

        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid appointment types', () => {
      const result = CreateAppointmentSchema.shape.appointmentType.safeParse('invalid_type');

      expect(result.success).toBe(false);
    });
  });

  describe('CreateAppointmentSchema', () => {
    const validAppointment = {
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      therapistId: '123e4567-e89b-12d3-a456-426614174001',
      locationId: '123e4567-e89b-12d3-a456-426614174002',
      appointmentDate: '2025-01-15',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      appointmentType: 'initial_assessment',
    };

    it('should accept valid appointment data', () => {
      const result = CreateAppointmentSchema.safeParse(validAppointment);

      expect(result.success).toBe(true);
    });

    it('should require clientId', () => {
      const { clientId, ...invalid } = validAppointment;
      const result = CreateAppointmentSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should require therapistId', () => {
      const { therapistId, ...invalid } = validAppointment;
      const result = CreateAppointmentSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should require appointmentDate', () => {
      const { appointmentDate, ...invalid } = validAppointment;
      const result = CreateAppointmentSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should require startTime and endTime', () => {
      const { startTime, endTime, ...invalid } = validAppointment;
      const result = CreateAppointmentSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const withOptional = {
        ...validAppointment,
        roomNumber: 'A-101',
        appointmentNotes: 'Client requested morning slot',
        isRecurring: false,
      };

      const result = CreateAppointmentSchema.safeParse(withOptional);

      expect(result.success).toBe(true);
    });
  });

  describe('UpdateAppointmentSchema', () => {
    it('should accept partial updates', () => {
      const updates = {
        status: 'confirmed',
        roomNumber: 'B-202',
      };

      const result = UpdateAppointmentSchema.safeParse(updates);

      expect(result.success).toBe(true);
    });

    it('should accept single field update', () => {
      const result = UpdateAppointmentSchema.safeParse({ status: 'confirmed' });

      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = UpdateAppointmentSchema.safeParse({});

      expect(result.success).toBe(true);
    });
  });

  describe('CancelAppointmentSchema', () => {
    it('should require reason', () => {
      const valid = {
        reason: 'client_request',
        note: 'Client had to reschedule',
      };

      const result = CancelAppointmentSchema.safeParse(valid);

      expect(result.success).toBe(true);
    });

    it('should fail without reason', () => {
      const result = CancelAppointmentSchema.safeParse({ note: 'Some note' });

      expect(result.success).toBe(false);
    });

    it('should allow optional note', () => {
      const result = CancelAppointmentSchema.safeParse({ reason: 'emergency' });

      expect(result.success).toBe(true);
    });
  });

  describe('RescheduleAppointmentSchema', () => {
    const validReschedule = {
      newDate: '2025-01-20',
      newStartTime: '10:00',
      newEndTime: '11:00',
      reason: 'Client requested different time',
    };

    it('should accept valid reschedule data', () => {
      const result = RescheduleAppointmentSchema.safeParse(validReschedule);

      expect(result.success).toBe(true);
    });

    it('should require all time fields', () => {
      const { newStartTime, ...invalid } = validReschedule;
      const result = RescheduleAppointmentSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should allow optional note', () => {
      const withNote = {
        ...validReschedule,
        note: 'Client prefers morning appointments',
      };

      const result = RescheduleAppointmentSchema.safeParse(withNote);

      expect(result.success).toBe(true);
    });
  });

  describe('RecurringAppointmentSchema', () => {
    const validRecurring = {
      appointmentData: {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        therapistId: '123e4567-e89b-12d3-a456-426614174001',
        locationId: '123e4567-e89b-12d3-a456-426614174002',
        appointmentDate: '2025-01-15',
        startTime: '09:00',
        endTime: '10:00',
        duration: 60,
        appointmentType: 'regular_session',
      },
      recurrencePattern: {
        frequency: 'weekly' as const,
        interval: 1,
        daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday
        endDate: '2025-12-31',
      },
    };

    it('should accept valid recurring appointment', () => {
      const result = RecurringAppointmentSchema.safeParse(validRecurring);

      expect(result.success).toBe(true);
    });

    it('should omit isRecurring and recurrencePattern from appointmentData', () => {
      // The schema should not allow these fields in appointmentData
      const withForbiddenFields = {
        appointmentData: {
          ...validRecurring.appointmentData,
          isRecurring: true,
          recurrencePattern: {},
        },
        recurrencePattern: validRecurring.recurrencePattern,
      };

      const result = RecurringAppointmentSchema.safeParse(withForbiddenFields);

      // Should pass because omit removes these fields from validation
      expect(result.success).toBe(true);
    });

    it('should require recurrence pattern', () => {
      const { recurrencePattern, ...invalid } = validRecurring;
      const result = RecurringAppointmentSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });
  });

  describe('WaitlistSchema', () => {
    const validWaitlist = {
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      therapistId: '123e4567-e89b-12d3-a456-426614174001',
      preferredDates: ['2025-01-20', '2025-01-22'],
      preferredTimes: ['09:00', '10:00', '14:00'],
      priority: 'standard',
    };

    it('should accept valid waitlist entry', () => {
      const result = WaitlistSchema.safeParse(validWaitlist);

      expect(result.success).toBe(true);
    });

    it('should require clientId and therapistId', () => {
      const { clientId, ...invalid } = validWaitlist;
      const result = WaitlistSchema.safeParse(invalid);

      expect(result.success).toBe(false);
    });

    it('should accept urgent priority', () => {
      const urgent = { ...validWaitlist, priority: 'urgent' };
      const result = WaitlistSchema.safeParse(urgent);

      expect(result.success).toBe(true);
    });

    it('should use standard priority by default', () => {
      const { priority, ...withoutPriority } = validWaitlist;
      const result = WaitlistSchema.safeParse(withoutPriority);

      expect(result.success).toBe(true);

      if (result.success) {
        expect(result.data.priority).toBe('standard');
      }
    });
  });
});
