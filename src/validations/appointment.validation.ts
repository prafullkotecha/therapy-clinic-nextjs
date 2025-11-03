import { z } from 'zod';

/**
 * Appointment status options
 */
export const AppointmentStatus = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

export type AppointmentStatusType
  = typeof AppointmentStatus[keyof typeof AppointmentStatus];

/**
 * Appointment type options
 */
export const AppointmentType = {
  INITIAL_ASSESSMENT: 'initial_assessment',
  REGULAR_SESSION: 'regular_session',
  FAMILY_SESSION: 'family_session',
  GROUP_SESSION: 'group_session',
  FOLLOW_UP: 'follow_up',
} as const;

export type AppointmentTypeType
  = typeof AppointmentType[keyof typeof AppointmentType];

/**
 * Recurrence frequency options
 */
export const RecurrenceFrequency = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
} as const;

export type RecurrenceFrequencyType
  = typeof RecurrenceFrequency[keyof typeof RecurrenceFrequency];

/**
 * Recurrence pattern schema
 */
export const RecurrencePatternSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
  interval: z.number().int().min(1).max(52), // Max 52 weeks
  daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
});

export type RecurrencePattern = z.infer<typeof RecurrencePatternSchema>;

/**
 * Create appointment schema
 */
export const CreateAppointmentSchema = z.object({
  clientId: z.string().uuid(),
  therapistId: z.string().uuid(),
  locationId: z.string().uuid(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), // HH:MM or HH:MM:SS
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  duration: z.number().int().min(15).max(480), // 15 min to 8 hours
  appointmentType: z.enum([
    'initial_assessment',
    'regular_session',
    'family_session',
    'group_session',
    'follow_up',
  ]),
  roomNumber: z.string().max(20).optional(),
  appointmentNotes: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: RecurrencePatternSchema.optional(),
});

export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

/**
 * Update appointment schema
 */
export const UpdateAppointmentSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  duration: z.number().int().min(15).max(480).optional(),
  appointmentType: z
    .enum([
      'initial_assessment',
      'regular_session',
      'family_session',
      'group_session',
      'follow_up',
    ])
    .optional(),
  roomNumber: z.string().max(20).optional(),
  status: z
    .enum([
      'scheduled',
      'confirmed',
      'checked_in',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
    ])
    .optional(),
  appointmentNotes: z.string().optional(),
  checkInTime: z.date().optional(),
  checkOutTime: z.date().optional(),
});

export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;

/**
 * Cancel appointment schema
 */
export const CancelAppointmentSchema = z.object({
  reason: z.string().max(100),
  note: z.string().optional(),
});

export type CancelAppointmentInput = z.infer<typeof CancelAppointmentSchema>;

/**
 * Reschedule appointment schema
 */
export const RescheduleAppointmentSchema = z.object({
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newStartTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  newEndTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  reason: z.string().max(100).optional(),
  note: z.string().optional(),
});

export type RescheduleAppointmentInput = z.infer<
  typeof RescheduleAppointmentSchema
>;

/**
 * Recurring appointment schema
 */
export const RecurringAppointmentSchema = z.object({
  appointmentData: CreateAppointmentSchema.omit({
    isRecurring: true,
    recurrencePattern: true,
  }),
  recurrencePattern: RecurrencePatternSchema,
});

export type RecurringAppointmentInput = z.infer<
  typeof RecurringAppointmentSchema
>;

/**
 * Appointment query parameters schema
 */
export const AppointmentQueryParamsSchema = z.object({
  clientId: z.string().uuid().optional(),
  therapistId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  status: z
    .enum([
      'scheduled',
      'confirmed',
      'checked_in',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
    ])
    .optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type AppointmentQueryParams = z.infer<
  typeof AppointmentQueryParamsSchema
>;

/**
 * Check availability schema
 */
export const CheckAvailabilitySchema = z.object({
  therapistId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
});

export type CheckAvailabilityInput = z.infer<typeof CheckAvailabilitySchema>;

/**
 * Waitlist schema
 */
export const WaitlistSchema = z.object({
  clientId: z.string().uuid(),
  therapistId: z.string().uuid(),
  preferredDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  preferredTimes: z.array(z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/)).optional(),
  priority: z.enum(['standard', 'urgent']).default('standard'),
});

export type WaitlistInput = z.infer<typeof WaitlistSchema>;
