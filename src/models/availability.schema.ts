import { date, index, pgTable, text, time, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { locations, tenants } from './tenant.schema';
import { therapists } from './therapist.schema';

/**
 * Therapist Availability Overrides
 *
 * This table tracks specific availability changes/blocks that override
 * the default availability template stored in therapists.availability.
 *
 * Use cases:
 * - Time off / PTO
 * - Special hours (working outside normal schedule)
 * - Blocked time (meetings, trainings)
 * - Location-specific availability
 */
export const therapistAvailability = pgTable('therapist_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),
  locationId: uuid('location_id').references(() => locations.id),

  // Date range
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),

  // Time range (null = all day)
  startTime: time('start_time'),
  endTime: time('end_time'),

  // Type of availability change
  availabilityType: varchar('availability_type', { length: 20 }).notNull(),
  // available, unavailable, blocked, time_off

  // Reason/description
  reason: varchar('reason', { length: 100 }),
  notes: text('notes'),

  // Recurrence pattern (for recurring blocks)
  isRecurring: varchar('is_recurring', { length: 20 }).default('none'),
  // none, weekly, biweekly, monthly

  // Days of week for recurring (JSON array: [0,1,2] = Sun, Mon, Tue)
  recurringDays: text('recurring_days'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdIdx: index('therapist_availability_tenant_id_idx').on(table.tenantId),
    therapistIdIdx: index('therapist_availability_therapist_id_idx').on(table.therapistId),
    locationIdIdx: index('therapist_availability_location_id_idx').on(table.locationId),
    dateRangeIdx: index('therapist_availability_date_range_idx').on(table.startDate, table.endDate),
    therapistDateIdx: index('therapist_availability_therapist_date_idx').on(table.therapistId, table.startDate, table.endDate),
  };
});
