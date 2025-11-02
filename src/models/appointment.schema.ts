import { boolean, date, index, integer, jsonb, pgTable, text, time, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { clients } from './client.schema';
import { locations, tenants } from './tenant.schema';
import { therapists } from './therapist.schema';
import { users } from './user.schema';

// Appointments table
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  locationId: uuid('location_id').references(() => locations.id).notNull(),

  clientId: uuid('client_id').references(() => clients.id).notNull(),
  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),

  // Scheduling
  appointmentDate: date('appointment_date').notNull(),
  startTime: time('start_time').notNull(),
  endTime: time('end_time').notNull(),
  duration: integer('duration').notNull(), // minutes

  // Type
  appointmentType: varchar('appointment_type', { length: 50 }).notNull(),
  // initial_assessment, regular_session, family_session, group_session

  // Location details
  roomNumber: varchar('room_number', { length: 20 }),

  // Status
  status: varchar('status', { length: 20 }).default('scheduled'),
  // scheduled, confirmed, checked_in, in_progress, completed, cancelled, no_show

  // Recurrence
  isRecurring: boolean('is_recurring').default(false),
  // { frequency: 'weekly', interval: 1, daysOfWeek: [1, 3], endDate: '2025-12-31' }
  recurrencePattern: jsonb('recurrence_pattern'),
  // Self-referencing FK - references parent appointment in recurring series
  parentAppointmentId: uuid('parent_appointment_id'),

  // Notifications
  reminderSent48h: boolean('reminder_sent_48h').default(false),
  reminderSent24h: boolean('reminder_sent_24h').default(false),
  reminderSent2h: boolean('reminder_sent_2h').default(false),

  // Cancellation
  cancelledAt: timestamp('cancelled_at'),
  cancelledBy: uuid('cancelled_by').references(() => users.id),
  cancellationReason: varchar('cancellation_reason', { length: 100 }),
  cancellationNote: text('cancellation_note'),

  // Session tracking
  checkInTime: timestamp('check_in_time'),
  checkOutTime: timestamp('check_out_time'),
  appointmentNotes: text('appointment_notes_encrypted'), // Encrypted

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => {
  return {
    tenantIdIdx: index('appointments_tenant_id_idx').on(table.tenantId),
    locationIdIdx: index('appointments_location_id_idx').on(table.locationId),
    clientIdIdx: index('appointments_client_id_idx').on(table.clientId),
    therapistIdIdx: index('appointments_therapist_id_idx').on(table.therapistId),
    appointmentDateIdx: index('appointments_appointment_date_idx').on(table.appointmentDate),
    statusIdx: index('appointments_status_idx').on(table.status),
    therapistDateIdx: index('appointments_therapist_date_idx').on(table.therapistId, table.appointmentDate),
  };
});

// Waitlist table - Clients waiting for appointments
export const waitlist = pgTable('waitlist', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  clientId: uuid('client_id').references(() => clients.id).notNull(),
  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),

  preferredDates: jsonb('preferred_dates'),
  preferredTimes: jsonb('preferred_times'),
  priority: varchar('priority', { length: 20 }).default('standard'),

  addedAt: timestamp('added_at').defaultNow().notNull(),
  notifiedAt: timestamp('notified_at'),
  status: varchar('status', { length: 20 }).default('waiting'),
  // waiting, notified, scheduled, expired
}, (table) => {
  return {
    tenantIdIdx: index('waitlist_tenant_id_idx').on(table.tenantId),
    clientIdIdx: index('waitlist_client_id_idx').on(table.clientId),
    therapistIdIdx: index('waitlist_therapist_id_idx').on(table.therapistId),
    statusIdx: index('waitlist_status_idx').on(table.status),
    priorityIdx: index('waitlist_priority_idx').on(table.priority),
  };
});
