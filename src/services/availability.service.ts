import type {
  AvailabilityQueryParams,
  CreateAvailabilityInput,
  UpdateAvailabilityInput,
} from '@/validations/availability.validation';
import { and, eq, gte, lte } from 'drizzle-orm';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { therapistAvailability } from '@/models/availability.schema';
import { therapists } from '@/models/therapist.schema';
import { logAudit } from '@/services/audit.service';

/**
 * Availability Service
 * Handles therapist availability management and overrides
 *
 * Availability system:
 * - Base availability is stored in therapists.availability (JSON template)
 * - Overrides/exceptions are in therapist_availability table
 * - Types: available (special hours), unavailable (PTO), blocked (meetings)
 */

export type AvailabilityOverride = {
  id: string;
  tenantId: string;
  therapistId: string;
  locationId: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  availabilityType: string;
  reason: string | null;
  notes: string | null;
  isRecurring: string | null;
  recurringDays: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type AvailabilityTemplate = {
  monday?: Array<{ start: string; end: string }>;
  tuesday?: Array<{ start: string; end: string }>;
  wednesday?: Array<{ start: string; end: string }>;
  thursday?: Array<{ start: string; end: string }>;
  friday?: Array<{ start: string; end: string }>;
  saturday?: Array<{ start: string; end: string }>;
  sunday?: Array<{ start: string; end: string }>;
};

export type DayAvailability = {
  date: string;
  dayOfWeek: string;
  isAvailable: boolean;
  timeSlots: Array<{ start: string; end: string }>;
  overrides: AvailabilityOverride[];
};

/**
 * Get availability overrides with filters
 */
export async function getAvailabilityOverrides(
  tenantId: string,
  userId: string,
  params?: AvailabilityQueryParams,
): Promise<AvailabilityOverride[]> {
  return withTenantContext(tenantId, async () => {
    const conditions: any[] = [eq(therapistAvailability.tenantId, tenantId)];

    if (params?.therapistId) {
      conditions.push(eq(therapistAvailability.therapistId, params.therapistId));
    }
    if (params?.locationId) {
      conditions.push(eq(therapistAvailability.locationId, params.locationId));
    }
    if (params?.startDate) {
      conditions.push(gte(therapistAvailability.startDate, params.startDate));
    }
    if (params?.endDate) {
      conditions.push(lte(therapistAvailability.endDate, params.endDate));
    }
    if (params?.availabilityType) {
      conditions.push(
        eq(therapistAvailability.availabilityType, params.availabilityType),
      );
    }

    const results = await db
      .select()
      .from(therapistAvailability)
      .where(and(...conditions));

    await logAudit(tenantId, {
      userId,
      action: 'read',
      resource: 'availability_overrides',
      resourceId: null,
      phiAccessed: false,
      metadata: { count: results.length, filters: params },
    });

    return results as AvailabilityOverride[];
  });
}

/**
 * Get therapist's base availability template
 */
export async function getTherapistAvailabilityTemplate(
  tenantId: string,
  therapistId: string,
): Promise<AvailabilityTemplate | null> {
  return withTenantContext(tenantId, async () => {
    const [therapist] = await db
      .select()
      .from(therapists)
      .where(and(eq(therapists.tenantId, tenantId), eq(therapists.id, therapistId)));

    if (!therapist || !therapist.availability) {
      return null;
    }

    return therapist.availability as AvailabilityTemplate;
  });
}

/**
 * Update therapist's base availability template
 */
export async function updateTherapistAvailabilityTemplate(
  tenantId: string,
  userId: string,
  therapistId: string,
  template: AvailabilityTemplate,
): Promise<void> {
  return withTenantContext(tenantId, async () => {
    await db
      .update(therapists)
      .set({
        availability: template,
        updatedAt: new Date(),
      })
      .where(and(eq(therapists.tenantId, tenantId), eq(therapists.id, therapistId)));

    await logAudit(tenantId, {
      userId,
      action: 'update',
      resource: 'therapist_availability_template',
      resourceId: therapistId,
      phiAccessed: false,
      metadata: { daysUpdated: Object.keys(template) },
    });
  });
}

/**
 * Create availability override (PTO, special hours, blocked time)
 */
export async function createAvailabilityOverride(
  tenantId: string,
  userId: string,
  input: CreateAvailabilityInput,
): Promise<AvailabilityOverride> {
  return withTenantContext(tenantId, async () => {
    const [override] = await db
      .insert(therapistAvailability)
      .values({
        ...input,
        tenantId,
      })
      .returning();

    if (!override) {
      throw new Error('Failed to create availability override');
    }

    await logAudit(tenantId, {
      userId,
      action: 'create',
      resource: 'availability_override',
      resourceId: override.id,
      phiAccessed: false,
      metadata: {
        type: input.availabilityType,
        therapistId: input.therapistId,
        dateRange: `${input.startDate} - ${input.endDate}`,
      },
    });

    return override as AvailabilityOverride;
  });
}

/**
 * Update availability override
 */
export async function updateAvailabilityOverride(
  tenantId: string,
  userId: string,
  overrideId: string,
  input: UpdateAvailabilityInput,
): Promise<AvailabilityOverride> {
  return withTenantContext(tenantId, async () => {
    const [updated] = await db
      .update(therapistAvailability)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(therapistAvailability.tenantId, tenantId),
          eq(therapistAvailability.id, overrideId),
        ),
      )
      .returning();

    if (!updated) {
      throw new Error('Availability override not found');
    }

    await logAudit(tenantId, {
      userId,
      action: 'update',
      resource: 'availability_override',
      resourceId: overrideId,
      phiAccessed: false,
      metadata: { changes: Object.keys(input) },
    });

    return updated as AvailabilityOverride;
  });
}

/**
 * Delete availability override
 */
export async function deleteAvailabilityOverride(
  tenantId: string,
  userId: string,
  overrideId: string,
): Promise<void> {
  return withTenantContext(tenantId, async () => {
    await db
      .delete(therapistAvailability)
      .where(
        and(
          eq(therapistAvailability.tenantId, tenantId),
          eq(therapistAvailability.id, overrideId),
        ),
      );

    await logAudit(tenantId, {
      userId,
      action: 'delete',
      resource: 'availability_override',
      resourceId: overrideId,
      phiAccessed: false,
    });
  });
}

/**
 * Helper function to filter out time slots that overlap with unavailable/blocked periods
 * Uses proper time comparison to handle edge cases
 */
function filterOverlappingSlots(
  slots: { start: string; end: string }[],
  overrideStart: string,
  overrideEnd: string,
): { start: string; end: string }[] {
  return slots.filter((slot) => {
    // No overlap if slot ends before or at override start, or starts after or at override end
    // Using <= and >= ensures proper handling of adjacent time slots (e.g., 10:00-11:00 and 11:00-12:00)
    return slot.end <= overrideStart || slot.start >= overrideEnd;
  });
}

/**
 * Get effective availability for a therapist on a specific date
 * Combines base template with overrides
 */
export async function getEffectiveAvailability(
  tenantId: string,
  therapistId: string,
  date: string,
): Promise<DayAvailability> {
  return withTenantContext(tenantId, async () => {
    // Get day of week (0 = Sunday, 1 = Monday, ...)
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    const dayNames = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ] as const;
    const dayName = dayNames[dayOfWeek] as keyof AvailabilityTemplate;

    // Get base template
    const template = await getTherapistAvailabilityTemplate(tenantId, therapistId);
    const baseSlots = template?.[dayName] || [];

    // Get overrides for this date
    const overrides = await db
      .select()
      .from(therapistAvailability)
      .where(
        and(
          eq(therapistAvailability.tenantId, tenantId),
          eq(therapistAvailability.therapistId, therapistId),
          lte(therapistAvailability.startDate, date),
          gte(therapistAvailability.endDate, date),
        ),
      );

    // Apply overrides to base slots
    let effectiveSlots = [...baseSlots];
    let isAvailable = baseSlots.length > 0;

    for (const override of overrides) {
      if (override.availabilityType === 'unavailable') {
        // Remove slots during unavailable time
        if (override.startTime && override.endTime) {
          effectiveSlots = filterOverlappingSlots(
            effectiveSlots,
            override.startTime,
            override.endTime,
          );
        } else {
          // All-day unavailable
          effectiveSlots = [];
          isAvailable = false;
        }
      } else if (override.availabilityType === 'available') {
        // Add special hours
        if (override.startTime && override.endTime) {
          effectiveSlots.push({
            start: override.startTime,
            end: override.endTime,
          });
        }
        isAvailable = true;
      } else if (override.availabilityType === 'blocked') {
        // Remove blocked time
        if (override.startTime && override.endTime) {
          effectiveSlots = filterOverlappingSlots(
            effectiveSlots,
            override.startTime,
            override.endTime,
          );
        }
      }
    }

    return {
      date,
      dayOfWeek: dayName as string,
      isAvailable,
      timeSlots: effectiveSlots.sort((a, b) => a.start.localeCompare(b.start)),
      overrides: overrides as AvailabilityOverride[],
    };
  });
}

/**
 * Get availability for a therapist across a date range
 */
export async function getAvailabilityRange(
  tenantId: string,
  therapistId: string,
  startDate: string,
  endDate: string,
): Promise<DayAvailability[]> {
  return withTenantContext(tenantId, async () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const availability: DayAvailability[] = [];

    // Calculate number of days in range
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Iterate through each day in range
    for (let i = 0; i < daysDiff; i++) {
      const current = new Date(start);
      current.setDate(start.getDate() + i);
      const dateStr = current.toISOString().split('T')[0];
      if (dateStr) {
        const dayAvailability = await getEffectiveAvailability(
          tenantId,
          therapistId,
          dateStr,
        );
        availability.push(dayAvailability);
      }
    }

    return availability;
  });
}

/**
 * Check if therapist is available at a specific date/time
 */
export async function isTherapistAvailable(
  tenantId: string,
  therapistId: string,
  date: string,
  startTime: string,
  endTime: string,
): Promise<boolean> {
  const dayAvailability = await getEffectiveAvailability(
    tenantId,
    therapistId,
    date,
  );

  if (!dayAvailability.isAvailable) {
    return false;
  }

  // Check if requested time falls within any available slot
  return dayAvailability.timeSlots.some(
    slot => startTime >= slot.start && endTime <= slot.end,
  );
}
