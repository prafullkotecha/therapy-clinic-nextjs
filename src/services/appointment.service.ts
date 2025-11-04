import type {
  AppointmentQueryParams,
  CancelAppointmentInput,
  CreateAppointmentInput,
  RecurrencePattern,
  RecurringAppointmentInput,
  RescheduleAppointmentInput,
  UpdateAppointmentInput,
} from '@/validations/appointment.validation';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import { and, eq, gte, lte, or, sql } from 'drizzle-orm';
import { DEFAULT_APPOINTMENT_DURATION_MINUTES } from '@/constants/appointments';
import { getEncryptionServiceSync } from '@/lib/encryption';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { appointments, waitlist } from '@/models/appointment.schema';
import { locations } from '@/models/tenant.schema';
import { therapists } from '@/models/therapist.schema';
import { users } from '@/models/user.schema';
import { logAudit } from '@/services/audit.service';
import { getEffectiveAvailability } from '@/services/availability.service';

/**
 * Appointment Service
 * Handles business logic for appointment scheduling, cancellation, and management
 *
 * IMPORTANT: All PHI fields must be encrypted before storage and decrypted after retrieval
 */

// Constants for time calculations
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parse date and time in a specific timezone and return UTC Date object
 * @param date - Date string in format YYYY-MM-DD
 * @param time - Time string in format HH:MM
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns Date object representing the time in UTC
 */
function parseTimeInZone(date: string, time: string, timezone: string): Date {
  // Validate time format with regex (HH:MM or H:MM or HH:M or H:M)
  const timeRegex = /^\d{1,2}:\d{1,2}$/;
  if (!timeRegex.test(time)) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const [hours, minutes] = time.split(':').map(Number);

  if (
    hours === undefined
    || minutes === undefined
    || Number.isNaN(hours)
    || Number.isNaN(minutes)
    || hours < 0
    || hours > 23
    || minutes < 0
    || minutes > 59
  ) {
    throw new Error(`Invalid time format: ${time}`);
  }

  const dateTimeStr = `${date} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;

  return fromZonedTime(dateTimeStr, timezone);
}

/**
 * Format a Date object to HH:MM string in a specific timezone
 * @param date - Date object to format
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns Time string in format HH:MM
 */
function formatTimeInZone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, 'HH:mm');
}

export type AppointmentWithDetails = {
  id: string;
  tenantId: string;
  locationId: string;
  clientId: string;
  therapistId: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  appointmentType: string;
  roomNumber: string | null;
  status: string | null;
  isRecurring: boolean | null;
  recurrencePattern: unknown;
  parentAppointmentId: string | null;
  reminderSent48h: boolean | null;
  reminderSent24h: boolean | null;
  reminderSent2h: boolean | null;
  cancelledAt: Date | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  cancellationNote: string | null;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  appointmentNotes: string | null; // Encrypted in DB
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
};

export type ConflictCheckResult = {
  hasConflict: boolean;
  conflicts: Array<{
    appointmentId: string;
    startTime: string;
    endTime: string;
    reason: string;
  }>;
};

export type AvailableSlot = {
  startTime: string;
  endTime: string;
  therapistId: string;
  therapistName: string;
  locationId: string;
};

/**
 * Get appointments with optional filters
 */
export async function getAppointments(
  tenantId: string,
  userId: string,
  params?: AppointmentQueryParams,
): Promise<AppointmentWithDetails[]> {
  return withTenantContext(tenantId, async () => {
    const encryption = getEncryptionServiceSync();
    const conditions: any[] = [eq(appointments.tenantId, tenantId)];

    // Apply filters
    if (params?.clientId) {
      conditions.push(eq(appointments.clientId, params.clientId));
    }
    if (params?.therapistId) {
      conditions.push(eq(appointments.therapistId, params.therapistId));
    }
    if (params?.locationId) {
      conditions.push(eq(appointments.locationId, params.locationId));
    }
    if (params?.status) {
      conditions.push(eq(appointments.status, params.status));
    }
    if (params?.startDate) {
      conditions.push(gte(appointments.appointmentDate, params.startDate));
    }
    if (params?.endDate) {
      conditions.push(lte(appointments.appointmentDate, params.endDate));
    }

    const results = await db
      .select()
      .from(appointments)
      .where(and(...conditions));

    // Decrypt PHI fields
    const decryptedResults = results.map(apt => ({
      ...apt,
      appointmentNotes: apt.appointmentNotes
        ? encryption.decrypt(apt.appointmentNotes)
        : null,
    }));

    // Audit log
    await logAudit(tenantId, {
      userId,
      action: 'read',
      resource: 'appointments',
      resourceId: null,
      phiAccessed: true,
      metadata: { count: results.length, filters: params },
    });

    return decryptedResults as AppointmentWithDetails[];
  });
}

/**
 * Get a single appointment by ID
 */
export async function getAppointmentById(
  tenantId: string,
  userId: string,
  appointmentId: string,
): Promise<AppointmentWithDetails | null> {
  return withTenantContext(tenantId, async () => {
    const encryption = getEncryptionServiceSync();

    const [result] = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.id, appointmentId),
        ),
      );

    if (!result) {
      return null;
    }

    // Decrypt PHI
    const decrypted = {
      ...result,
      appointmentNotes: result.appointmentNotes
        ? encryption.decrypt(result.appointmentNotes)
        : null,
    };

    // Audit log
    await logAudit(tenantId, {
      userId,
      action: 'read',
      resource: 'appointment',
      resourceId: appointmentId,
      phiAccessed: true,
    });

    return decrypted as AppointmentWithDetails;
  });
}

/**
 * Check for scheduling conflicts
 */
export async function checkConflicts(
  tenantId: string,
  therapistId: string,
  appointmentDate: string,
  startTime: string,
  endTime: string,
  excludeAppointmentId?: string,
): Promise<ConflictCheckResult> {
  return withTenantContext(tenantId, async () => {
    const conditions: any[] = [
      eq(appointments.tenantId, tenantId),
      eq(appointments.therapistId, therapistId),
      eq(appointments.appointmentDate, appointmentDate),
      or(
        eq(appointments.status, 'scheduled'),
        eq(appointments.status, 'confirmed'),
        eq(appointments.status, 'in_progress'),
        eq(appointments.status, 'checked_in'),
      ),
    ];

    // Exclude current appointment if rescheduling
    if (excludeAppointmentId) {
      conditions.push(sql`${appointments.id} != ${excludeAppointmentId}`);
    }

    const conflictingAppointments = await db
      .select()
      .from(appointments)
      .where(and(...conditions));

    const conflicts = conflictingAppointments
      .filter((apt) => {
        // Check time overlap using standard interval overlap logic
        // Two intervals [a,b) and [c,d) overlap if a < d and b > c
        const aptStart = apt.startTime;
        const aptEnd = apt.endTime;
        return startTime < aptEnd && endTime > aptStart;
      })
      .map(apt => ({
        appointmentId: apt.id,
        startTime: apt.startTime,
        endTime: apt.endTime,
        reason: 'Therapist has another appointment',
      }));

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  });
}

/**
 * Create a new appointment
 */
export async function createAppointment(
  tenantId: string,
  userId: string,
  input: CreateAppointmentInput,
  parentAppointmentId?: string,
  skipConflictCheck = false,
): Promise<AppointmentWithDetails> {
  return withTenantContext(tenantId, async () => {
    const encryption = getEncryptionServiceSync();

    // Check for conflicts (skip if already checked in batch, e.g., for recurring appointments)
    if (!skipConflictCheck) {
      const conflictCheck = await checkConflicts(
        tenantId,
        input.therapistId,
        input.appointmentDate,
        input.startTime,
        input.endTime,
      );

      if (conflictCheck.hasConflict) {
        throw new Error(
          `Scheduling conflict: ${conflictCheck.conflicts.map(c => c.reason).join(', ')}`,
        );
      }
    }

    // Encrypt PHI fields
    const encrypted = {
      ...input,
      tenantId,
      appointmentNotes: input.appointmentNotes
        ? encryption.encrypt(input.appointmentNotes)
        : null,
      createdBy: userId,
      status: 'scheduled',
      ...(parentAppointmentId && { parentAppointmentId }),
    };

    const [newAppointment] = await db
      .insert(appointments)
      .values(encrypted)
      .returning();

    if (!newAppointment) {
      throw new Error('Failed to create appointment');
    }

    // Audit log
    await logAudit(tenantId, {
      userId,
      action: 'create',
      resource: 'appointment',
      resourceId: newAppointment.id,
      phiAccessed: true,
      metadata: { appointmentType: input.appointmentType },
    });

    // Decrypt for return
    const decrypted = {
      ...newAppointment,
      appointmentNotes: newAppointment.appointmentNotes
        ? encryption.decrypt(newAppointment.appointmentNotes)
        : null,
    };

    return decrypted as AppointmentWithDetails;
  });
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(
  tenantId: string,
  userId: string,
  appointmentId: string,
  input: UpdateAppointmentInput,
): Promise<AppointmentWithDetails> {
  return withTenantContext(tenantId, async () => {
    const encryption = getEncryptionServiceSync();

    // If time is changing, check for conflicts
    if (input.startTime || input.endTime || input.appointmentDate) {
      const existing = await getAppointmentById(tenantId, userId, appointmentId);
      if (!existing) {
        throw new Error('Appointment not found');
      }

      const conflictCheck = await checkConflicts(
        tenantId,
        existing.therapistId,
        input.appointmentDate || existing.appointmentDate,
        input.startTime || existing.startTime,
        input.endTime || existing.endTime,
        appointmentId,
      );

      if (conflictCheck.hasConflict) {
        throw new Error(
          `Scheduling conflict: ${conflictCheck.conflicts.map(c => c.reason).join(', ')}`,
        );
      }
    }

    // Encrypt PHI fields
    const encrypted: any = {
      ...input,
      updatedAt: new Date(),
    };

    if (input.appointmentNotes) {
      encrypted.appointmentNotes = encryption.encrypt(input.appointmentNotes);
    }

    const [updated] = await db
      .update(appointments)
      .set(encrypted)
      .where(
        and(eq(appointments.tenantId, tenantId), eq(appointments.id, appointmentId)),
      )
      .returning();

    if (!updated) {
      throw new Error('Appointment not found');
    }

    // Audit log
    await logAudit(tenantId, {
      userId,
      action: 'update',
      resource: 'appointment',
      resourceId: appointmentId,
      phiAccessed: true,
      metadata: { changes: Object.keys(input) },
    });

    // Decrypt for return
    const decrypted = {
      ...updated,
      appointmentNotes: updated.appointmentNotes
        ? encryption.decrypt(updated.appointmentNotes)
        : null,
    };

    return decrypted as AppointmentWithDetails;
  });
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(
  tenantId: string,
  userId: string,
  appointmentId: string,
  input: CancelAppointmentInput,
): Promise<AppointmentWithDetails> {
  return withTenantContext(tenantId, async () => {
    const encryption = getEncryptionServiceSync();

    const [cancelled] = await db
      .update(appointments)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: input.reason,
        cancellationNote: input.note,
        updatedAt: new Date(),
      })
      .where(
        and(eq(appointments.tenantId, tenantId), eq(appointments.id, appointmentId)),
      )
      .returning();

    if (!cancelled) {
      throw new Error('Appointment not found');
    }

    // Audit log
    await logAudit(tenantId, {
      userId,
      action: 'cancel',
      resource: 'appointment',
      resourceId: appointmentId,
      phiAccessed: true,
      metadata: { reason: input.reason },
    });

    // Decrypt for return
    const decrypted = {
      ...cancelled,
      appointmentNotes: cancelled.appointmentNotes
        ? encryption.decrypt(cancelled.appointmentNotes)
        : null,
    };

    return decrypted as AppointmentWithDetails;
  });
}

/**
 * Reschedule an appointment (cancel old, create new)
 */
export async function rescheduleAppointment(
  tenantId: string,
  userId: string,
  appointmentId: string,
  input: RescheduleAppointmentInput,
): Promise<AppointmentWithDetails> {
  return withTenantContext(tenantId, async () => {
    // Get existing appointment
    const existing = await getAppointmentById(tenantId, userId, appointmentId);
    if (!existing) {
      throw new Error('Appointment not found');
    }

    // Check for conflicts at new time
    const conflictCheck = await checkConflicts(
      tenantId,
      existing.therapistId,
      input.newDate,
      input.newStartTime,
      input.newEndTime,
    );

    if (conflictCheck.hasConflict) {
      throw new Error(
        `Scheduling conflict: ${conflictCheck.conflicts.map(c => c.reason).join(', ')}`,
      );
    }

    // Cancel existing appointment
    await cancelAppointment(tenantId, userId, appointmentId, {
      reason: input.reason || 'rescheduled',
      note: input.note
        ? `${input.note}. Rescheduled to ${input.newDate} ${input.newStartTime}-${input.newEndTime}`
        : `Rescheduled to ${input.newDate} ${input.newStartTime}-${input.newEndTime}`,
    });

    // Create new appointment
    const newAppointment = await createAppointment(tenantId, userId, {
      clientId: existing.clientId,
      therapistId: existing.therapistId,
      locationId: existing.locationId,
      appointmentDate: input.newDate,
      startTime: input.newStartTime,
      endTime: input.newEndTime,
      duration: existing.duration,
      appointmentType: existing.appointmentType as any,
      roomNumber: existing.roomNumber || undefined,
      appointmentNotes: input.note,
    });

    return newAppointment;
  });
}

/**
 * Helper: Check if two time slots overlap
 * Exported for testing purposes only
 */
export function slotsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
): boolean {
  // Slots overlap if start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1;
}

/**
 * Helper: Generate time slots from a time range
 * Exported for testing purposes only
 */
export function generateSlotsFromTimeRange(
  startTime: string,
  endTime: string,
  slotDuration: number,
  date: string,
  timezone: string,
): Array<{ startTime: string; endTime: string }> {
  const slots: Array<{ startTime: string; endTime: string }> = [];

  try {
    // Parse date/time in the specified timezone
    // This will throw an error for invalid time formats
    let currentSlotStart = parseTimeInZone(date, startTime, timezone);
    const rangeEnd = parseTimeInZone(date, endTime, timezone);

    // Generate slots
    while (currentSlotStart < rangeEnd) {
      const slotEnd = new Date(currentSlotStart.getTime() + slotDuration * MILLISECONDS_PER_MINUTE);

      // Only add if slot end doesn't exceed range end
      if (slotEnd <= rangeEnd) {
        // Format times in the specified timezone
        const startStr = formatTimeInZone(currentSlotStart, timezone);
        const endStr = formatTimeInZone(slotEnd, timezone);

        slots.push({
          startTime: startStr,
          endTime: endStr,
        });
      }

      // Move to next slot
      currentSlotStart = new Date(currentSlotStart.getTime() + slotDuration * MILLISECONDS_PER_MINUTE);
    }
  } catch (err) {
    logger.warn(
      `generateSlotsFromTimeRange: Failed to generate slots for date=${date}, startTime=${startTime}, endTime=${endTime}, slotDuration=${slotDuration}, timezone=${timezone}. Error: ${err instanceof Error ? err.message : String(err)}`
    );
    // Return empty array for invalid input
    return slots;
  }

  return slots;
}

/**
 * Get available time slots for a therapist on a given date
 * Generates slots from effective availability, excluding booked appointments
 */
export async function getAvailableSlots(
  tenantId: string,
  therapistId: string,
  date: string,
  slotDuration: number = DEFAULT_APPOINTMENT_DURATION_MINUTES,
): Promise<AvailableSlot[]> {
  return withTenantContext(tenantId, async () => {
    // Get effective availability for the date
    const dayAvailability = await getEffectiveAvailability(tenantId, therapistId, date);

    if (!dayAvailability.isAvailable || dayAvailability.timeSlots.length === 0) {
      return [];
    }

    // Get booked appointments for this therapist on this date
    const bookedAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.therapistId, therapistId),
          eq(appointments.appointmentDate, date),
          or(
            eq(appointments.status, 'scheduled'),
            eq(appointments.status, 'checked-in'),
            eq(appointments.status, 'confirmed'),
          ),
        ),
      );

    // Get therapist details for name and location
    const [therapist] = await db
      .select({
        therapist: therapists,
        user: users,
      })
      .from(therapists)
      .innerJoin(users, eq(therapists.userId, users.id))
      .where(
        and(
          eq(therapists.tenantId, tenantId),
          eq(therapists.id, therapistId),
        ),
      );

    if (!therapist) {
      return [];
    }

    const encryption = getEncryptionServiceSync();
    const firstName = therapist.user.firstName ? encryption.decrypt(therapist.user.firstName) : '';
    const lastName = therapist.user.lastName ? encryption.decrypt(therapist.user.lastName) : '';
    const therapistName = `${firstName} ${lastName}`.trim();

    // Get location timezone
    const locationId = therapist.therapist.primaryLocationId;
    let timezone = 'America/New_York'; // Default timezone

    if (locationId) {
      const [location] = await db
        .select()
        .from(locations)
        .where(eq(locations.id, locationId));

      if (location?.timezone) {
        timezone = location.timezone;
      }
    }

    // Generate slots from time slots
    const availableSlots: AvailableSlot[] = [];

    for (const timeSlot of dayAvailability.timeSlots) {
      const slots = generateSlotsFromTimeRange(
        timeSlot.start,
        timeSlot.end,
        slotDuration,
        date,
        timezone,
      );

      for (const slot of slots) {
        // Check if slot overlaps with any booked appointment
        const isBooked = bookedAppointments.some((apt) => {
          return slotsOverlap(
            slot.startTime,
            slot.endTime,
            apt.startTime,
            apt.endTime,
          );
        });

        if (!isBooked) {
          availableSlots.push({
            startTime: slot.startTime,
            endTime: slot.endTime,
            therapistId,
            therapistName,
            locationId: therapist.therapist.primaryLocationId || '',
          });
        }
      }
    }

    return availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  });
}

/**
 * Get available slots across a date range for a therapist
 * Optimized to batch database queries and avoid N+1 problems
 */
export async function getAvailableSlotsRange(
  tenantId: string,
  therapistId: string,
  startDate: string,
  endDate: string,
  slotDuration: number = DEFAULT_APPOINTMENT_DURATION_MINUTES,
): Promise<Record<string, AvailableSlot[]>> {
  return withTenantContext(tenantId, async () => {
    // 1. Fetch therapist details ONCE (not N times)
    const [therapist] = await db
      .select({
        therapist: therapists,
        user: users,
      })
      .from(therapists)
      .innerJoin(users, eq(therapists.userId, users.id))
      .where(
        and(
          eq(therapists.tenantId, tenantId),
          eq(therapists.id, therapistId),
        ),
      );

    if (!therapist) {
      return {};
    }

    // 2. Decrypt therapist name ONCE
    const encryption = getEncryptionServiceSync();
    const firstName = therapist.user.firstName ? encryption.decrypt(therapist.user.firstName) : '';
    const lastName = therapist.user.lastName ? encryption.decrypt(therapist.user.lastName) : '';
    const therapistName = `${firstName} ${lastName}`.trim();

    // 3. Get location timezone ONCE
    const locationId = therapist.therapist.primaryLocationId;
    let timezone = 'America/New_York'; // Default timezone

    if (locationId) {
      const [location] = await db
        .select()
        .from(locations)
        .where(eq(locations.id, locationId));

      if (location?.timezone) {
        timezone = location.timezone;
      }
    }

    // 4. Batch fetch ALL appointments for the entire date range in ONE query
    const allAppointments = await db
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.therapistId, therapistId),
          gte(appointments.appointmentDate, startDate),
          lte(appointments.appointmentDate, endDate),
          or(
            eq(appointments.status, 'scheduled'),
            eq(appointments.status, 'checked-in'),
            eq(appointments.status, 'confirmed'),
          ),
        ),
      );

    // 5. Group appointments by date (in-memory, fast)
    const appointmentsByDate = allAppointments.reduce(
      (acc, apt) => {
        if (!acc[apt.appointmentDate]) {
          acc[apt.appointmentDate] = [];
        }

        acc[apt.appointmentDate]!.push(apt);

        return acc;
      },
      {} as Record<string, typeof allAppointments>,
    );

    // 6. Iterate through dates (no DB queries in loop now - just availability check)
    const result: Record<string, AvailableSlot[]> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / MILLISECONDS_PER_DAY) + 1;

    for (let i = 0; i < daysDiff; i++) {
      const current = new Date(start.getTime() + i * MILLISECONDS_PER_DAY);
      const dateStr = current.toISOString().split('T')[0];

      if (!dateStr) {
        continue;
      }

      // Get availability for this date (only external call in loop)
      const dayAvailability = await getEffectiveAvailability(tenantId, therapistId, dateStr);

      if (!dayAvailability.isAvailable || dayAvailability.timeSlots.length === 0) {
        result[dateStr] = [];
        continue;
      }

      // Get booked appointments for this date from in-memory cache
      const bookedForDay = appointmentsByDate[dateStr] || [];
      const availableSlots: AvailableSlot[] = [];

      // Generate slots for each time range
      for (const timeSlot of dayAvailability.timeSlots) {
        const slots = generateSlotsFromTimeRange(
          timeSlot.start,
          timeSlot.end,
          slotDuration,
          dateStr,
          timezone,
        );

        for (const slot of slots) {
          // Check if slot overlaps with any booked appointment
          const isBooked = bookedForDay.some(apt =>
            slotsOverlap(slot.startTime, slot.endTime, apt.startTime, apt.endTime),
          );

          if (!isBooked) {
            availableSlots.push({
              startTime: slot.startTime,
              endTime: slot.endTime,
              therapistId,
              therapistName,
              locationId: locationId || '',
            });
          }
        }
      }

      result[dateStr] = availableSlots.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }

    return result;
  });
}

/**
 * Generate dates for recurring appointments based on pattern
 */
function generateRecurrenceDates(
  pattern: RecurrencePattern,
  startDate: string,
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(pattern.endDate);

  // Start from next occurrence (not the parent appointment date)
  const currentDate = new Date(start);

  switch (pattern.frequency) {
    case 'daily': {
      currentDate.setDate(currentDate.getDate() + pattern.interval);
      // eslint-disable-next-line no-unmodified-loop-condition
      while (currentDate <= end) {
        dates.push(formatDate(currentDate));
        currentDate.setDate(currentDate.getDate() + pattern.interval);
      }
      break;
    }

    case 'weekly':
    case 'biweekly': {
      const intervalWeeks = pattern.frequency === 'weekly' ? pattern.interval : pattern.interval * 2;

      // If daysOfWeek specified, use those; otherwise use start date's day
      const targetDays = pattern.daysOfWeek || [start.getDay()];

      currentDate.setDate(currentDate.getDate() + 1); // Start from day after parent

      // eslint-disable-next-line no-unmodified-loop-condition
      while (currentDate <= end) {
        const currentDay = currentDate.getDay();

        if (targetDays.includes(currentDay)) {
          // Check if this is on the correct week interval
          const weeksSinceStart
            = Math.floor(
              (currentDate.getTime() - start.getTime())
              / (7 * 24 * 60 * 60 * 1000),
            );

          if (weeksSinceStart % intervalWeeks === 0) {
            dates.push(formatDate(currentDate));
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
      break;
    }

    case 'monthly': {
      const dayOfMonth = start.getDate();
      currentDate.setMonth(currentDate.getMonth() + pattern.interval);

      // eslint-disable-next-line no-unmodified-loop-condition
      while (currentDate <= end) {
        // Handle case where day doesn't exist in month (e.g., Feb 31)
        const targetDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          Math.min(dayOfMonth, getLastDayOfMonth(currentDate)),
        );

        if (targetDate <= end) {
          dates.push(formatDate(targetDate));
        }

        currentDate.setMonth(currentDate.getMonth() + pattern.interval);
      }
      break;
    }
  }

  return dates;
}

/**
 * Helper: Format date to YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Helper: Get last day of month
 */
function getLastDayOfMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Create recurring appointments
 */
export async function createRecurringAppointments(
  tenantId: string,
  userId: string,
  input: RecurringAppointmentInput,
): Promise<AppointmentWithDetails[]> {
  return withTenantContext(tenantId, async () => {
    const createdAppointments: AppointmentWithDetails[] = [];

    // Create parent appointment
    const parentAppointment = await createAppointment(tenantId, userId, {
      ...input.appointmentData,
      isRecurring: true,
      recurrencePattern: input.recurrencePattern,
    });

    createdAppointments.push(parentAppointment);

    // Generate child appointments based on recurrence pattern
    const generatedDates = generateRecurrenceDates(
      input.recurrencePattern,
      input.appointmentData.appointmentDate,
    );

    // Collect all conflicts before creating any appointments (in parallel)
    const conflictChecks = await Promise.all(
      generatedDates.map(async date => ({
        date,
        result: await checkConflicts(
          tenantId,
          input.appointmentData.therapistId,
          date,
          input.appointmentData.startTime,
          input.appointmentData.endTime,
        ),
      })),
    );

    const allConflicts = conflictChecks
      .filter(({ result }) => result.hasConflict)
      .map(({ date, result }) => ({
        date,
        conflicts: result.conflicts,
      }));

    // If conflicts found, throw error with details
    if (allConflicts.length > 0) {
      const conflictDetails = allConflicts
        .map(
          c =>
            `${c.date}: ${c.conflicts.map(cf => cf.reason).join(', ')}`,
        )
        .join('; ');
      throw new Error(
        `Cannot create recurring appointments. Conflicts found: ${conflictDetails}`,
      );
    }

    // Create child appointments
    // Note: Skip individual conflict checks since we already validated all dates above
    const childAppointmentPromises = generatedDates.map(async (date) => {
      try {
        const childAppointment = await createAppointment(
          tenantId,
          userId,
          {
            ...input.appointmentData,
            appointmentDate: date,
            isRecurring: false,
            recurrencePattern: undefined,
          },
          parentAppointment.id, // Pass parentAppointmentId directly
          true, // skipConflictCheck - already validated in batch above
        );

        return childAppointment;
      } catch (error) {
        // Return error info for partial failure handling
        return {
          error: true,
          date,
          message: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const results = await Promise.all(childAppointmentPromises);

    // Separate successful and failed appointments
    // Use 'id' presence as discriminator (more robust than checking for 'error')
    const successful = results.filter(r => 'id' in r) as AppointmentWithDetails[];
    const failed = results.filter(r => !('id' in r)) as Array<{
      error: boolean;
      date: string;
      message: string;
    }>;

    createdAppointments.push(...successful);

    // If partial failures, log warning but continue
    if (failed.length > 0) {
      const failureDetails = failed
        .map(f => `${f.date}: ${f.message}`)
        .join('; ');
      logger.warn(
        `Partial failure creating recurring appointments: ${failureDetails}`,
      );

      await logAudit(tenantId, {
        userId,
        action: 'create_recurring_partial_failure',
        resource: 'appointment',
        resourceId: parentAppointment.id,
        phiAccessed: false,
      });
    }

    return createdAppointments;
  });
}

/**
 * Add client to waitlist
 */
export async function addToWaitlist(
  tenantId: string,
  clientId: string,
  therapistId: string,
  preferredDates?: string[],
  preferredTimes?: string[],
  priority: 'standard' | 'urgent' = 'standard',
): Promise<typeof waitlist.$inferSelect> {
  return withTenantContext(tenantId, async () => {
    const [newEntry] = await db
      .insert(waitlist)
      .values({
        tenantId,
        clientId,
        therapistId,
        preferredDates: preferredDates || [],
        preferredTimes: preferredTimes || [],
        priority,
        status: 'waiting',
      })
      .returning();

    if (!newEntry) {
      throw new Error('Failed to add to waitlist');
    }

    return newEntry;
  });
}

/**
 * Check waitlist and notify clients when slots become available
 */
export async function processWaitlist(
  tenantId: string,
  _therapistId: string,
  _date: string,
): Promise<void> {
  return withTenantContext(tenantId, async () => {
    // TODO: Implement waitlist processing logic
    // This is a placeholder implementation
    // Full implementation requires:
    // 1. Get waiting clients for this therapist
    // 2. Check available slots and notify first client in queue
    // 3. Implement notification service integration
  });
}
