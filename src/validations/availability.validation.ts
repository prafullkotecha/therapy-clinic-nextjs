import { z } from 'zod';

/**
 * Availability type options
 */
export const AvailabilityType = {
  AVAILABLE: 'available', // Special hours outside normal schedule
  UNAVAILABLE: 'unavailable', // PTO, time off
  BLOCKED: 'blocked', // Meetings, trainings, blocked time
  TIME_OFF: 'time_off', // Same as unavailable
} as const;

export type AvailabilityTypeType
  = typeof AvailabilityType[keyof typeof AvailabilityType];

/**
 * Recurrence pattern for availability
 */
export const AvailabilityRecurrence = {
  NONE: 'none',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
} as const;

export type AvailabilityRecurrenceType
  = typeof AvailabilityRecurrence[keyof typeof AvailabilityRecurrence];

/**
 * Time slot schema (for availability templates)
 */
export const TimeSlotSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/), // HH:MM or HH:MM:SS
  end: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
});

export type TimeSlot = z.infer<typeof TimeSlotSchema>;

/**
 * Availability template schema (weekly schedule)
 */
export const AvailabilityTemplateSchema = z.object({
  monday: z.array(TimeSlotSchema).optional(),
  tuesday: z.array(TimeSlotSchema).optional(),
  wednesday: z.array(TimeSlotSchema).optional(),
  thursday: z.array(TimeSlotSchema).optional(),
  friday: z.array(TimeSlotSchema).optional(),
  saturday: z.array(TimeSlotSchema).optional(),
  sunday: z.array(TimeSlotSchema).optional(),
});

export type AvailabilityTemplate = z.infer<typeof AvailabilityTemplateSchema>;

/**
 * Create availability override schema
 */
export const CreateAvailabilitySchema = z.object({
  therapistId: z.string().uuid(),
  locationId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(), // null = all day
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  availabilityType: z.enum(['available', 'unavailable', 'blocked', 'time_off']),
  reason: z.string().max(100).optional(),
  notes: z.string().optional(),
  isRecurring: z.enum(['none', 'weekly', 'biweekly', 'monthly']).default('none'),
  recurringDays: z.string().optional(), // JSON array: "[0,1,2]" for Sun, Mon, Tue
});

export type CreateAvailabilityInput = z.infer<typeof CreateAvailabilitySchema>;

/**
 * Update availability override schema
 */
export const UpdateAvailabilitySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  availabilityType: z
    .enum(['available', 'unavailable', 'blocked', 'time_off'])
    .optional(),
  reason: z.string().max(100).optional(),
  notes: z.string().optional(),
  isRecurring: z.enum(['none', 'weekly', 'biweekly', 'monthly']).optional(),
  recurringDays: z.string().optional(),
});

export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilitySchema>;

/**
 * Availability query parameters schema
 */
export const AvailabilityQueryParamsSchema = z.object({
  therapistId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  availabilityType: z
    .enum(['available', 'unavailable', 'blocked', 'time_off'])
    .optional(),
});

export type AvailabilityQueryParams = z.infer<
  typeof AvailabilityQueryParamsSchema
>;

/**
 * Get available slots schema
 */
export const GetAvailableSlotsSchema = z.object({
  therapistId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slotDuration: z.number().int().min(15).max(480).default(60), // minutes
});

export type GetAvailableSlotsInput = z.infer<typeof GetAvailableSlotsSchema>;
