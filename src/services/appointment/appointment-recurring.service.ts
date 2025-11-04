// Import from core service (will be updated after refactor complete)
// These imports will be updated to use the proper barrel export
import type { AppointmentWithDetails, ConflictCheckResult } from '../appointment.service';
import type {
  RecurrencePattern,
  RecurringAppointmentInput,
} from '@/validations/appointment.validation';
import { withTenantContext } from '@/lib/tenant-db';
import { logger } from '@/libs/Logger';

/**
 * Appointment Recurring Service
 * Handles recurring appointment pattern generation and creation
 */

import { logAudit } from '@/services/audit.service';

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
 * Note: This function has circular dependencies with createAppointment and checkConflicts
 * which will be resolved through the barrel export pattern
 */
export async function createRecurringAppointments(
  tenantId: string,
  userId: string,
  input: RecurringAppointmentInput,
  // These will be injected dependencies once refactoring is complete
  createAppointment: any,
  checkConflicts: any,
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
          (c: { date: string; conflicts: ConflictCheckResult['conflicts'] }) =>
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
