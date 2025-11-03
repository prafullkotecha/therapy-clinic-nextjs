import type {
  AppointmentQueryParams,
  CancelAppointmentInput,
  CreateAppointmentInput,
  RecurringAppointmentInput,
  RescheduleAppointmentInput,
  UpdateAppointmentInput,
} from '@/validations/appointment.validation';
import { and, eq, gte, lte, or, sql } from 'drizzle-orm';
import { getEncryptionServiceSync } from '@/lib/encryption';
import { withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { appointments, waitlist } from '@/models/appointment.schema';
import { logAudit } from '@/services/audit.service';

/**
 * Appointment Service
 * Handles business logic for appointment scheduling, cancellation, and management
 *
 * IMPORTANT: All PHI fields must be encrypted before storage and decrypted after retrieval
 */

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
): Promise<AppointmentWithDetails> {
  return withTenantContext(tenantId, async () => {
    const encryption = getEncryptionServiceSync();

    // Check for conflicts
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

    // Encrypt PHI fields
    const encrypted = {
      ...input,
      tenantId,
      appointmentNotes: input.appointmentNotes
        ? encryption.encrypt(input.appointmentNotes)
        : null,
      createdBy: userId,
      status: 'scheduled',
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
 * Get available time slots for a therapist on a given date
 */
export async function getAvailableSlots(
  tenantId: string,
  _therapistId: string,
  _date: string,
  _slotDuration: number = 60, // minutes
): Promise<AvailableSlot[]> {
  return withTenantContext(tenantId, async () => {
    // TODO: Implement slot generation logic
    // This is a placeholder implementation
    // Full implementation requires:
    // 1. Get therapist's scheduled appointments for the date
    // 2. Get therapist details for availability template
    // 3. Parse availability template from therapist.availability
    // 4. Check therapistAvailability for overrides
    // 5. Generate available slots based on availability and booked slots

    return [];
  });
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
    // TODO: Implement recurrence logic
    // - Parse recurrencePattern (frequency, interval, daysOfWeek, endDate)
    // - Generate appointment dates
    // - Create child appointments with parentAppointmentId

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
) {
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
