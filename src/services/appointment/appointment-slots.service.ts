import { addDays, differenceInDays, format } from 'date-fns';
import { and, eq, gte, lte, or } from 'drizzle-orm';
import { DEFAULT_APPOINTMENT_DURATION_MINUTES } from '@/constants/appointments';
import { getEncryptionServiceSync } from '@/lib/encryption';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { logger } from '@/libs/Logger';
import { appointments } from '@/models/appointment.schema';
import { locations } from '@/models/tenant.schema';
import { therapists } from '@/models/therapist.schema';
import { users } from '@/models/user.schema';
import { getEffectiveAvailability } from '@/services/availability.service';
import { formatTimeInZone, MILLISECONDS_PER_MINUTE, parseTimeInZone } from '@/utils/time-utils';

/**
 * Appointment Slots Service
 * Handles slot generation and availability calculations
 */

export type AvailableSlot = {
  startTime: string;
  endTime: string;
  therapistId: string;
  therapistName: string;
  locationId: string;
};

/**
 * Check if two time slots overlap
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
      `generateSlotsFromTimeRange: Failed to generate slots for date=${date}, startTime=${startTime}, endTime=${endTime}, slotDuration=${slotDuration}, timezone=${timezone}. Error: ${err instanceof Error ? err.message : String(err)}`,
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
    const daysDiff = differenceInDays(end, start) + 1;

    for (let i = 0; i < daysDiff; i++) {
      const current = addDays(start, i);
      const dateStr = format(current, 'yyyy-MM-dd');

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
