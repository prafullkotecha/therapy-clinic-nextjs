import { boolean, date, decimal, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { appointments } from './appointment.schema';
import { clients } from './client.schema';
import { locations, tenants } from './tenant.schema';
import { therapists } from './therapist.schema';
import { users } from './user.schema';

/**
 * Therapy Sessions
 *
 * This table tracks completed therapy sessions that have been delivered.
 * Sessions are created when appointments are completed (status: 'completed').
 * Used for billing, progress tracking, and reporting.
 *
 * Key differences from Appointments:
 * - Appointments = scheduled/future events
 * - Sessions = completed/historical records with billing data
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  locationId: uuid('location_id').references(() => locations.id).notNull(),

  // Links to appointment that generated this session
  appointmentId: uuid('appointment_id').references(() => appointments.id).notNull(),

  clientId: uuid('client_id').references(() => clients.id).notNull(),
  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),

  // Session details
  sessionDate: date('session_date').notNull(),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),

  // Session type
  sessionType: varchar('session_type', { length: 50 }).notNull(),
  // individual, family, group, assessment, consultation

  // Service codes for billing
  cptCode: varchar('cpt_code', { length: 10 }),
  // e.g., 97153 (ABA), 90834 (psychotherapy)
  modifier: varchar('modifier', { length: 10 }),
  placeOfService: varchar('place_of_service', { length: 2 }),
  // 11 = office, 02 = telehealth, etc.

  // Units billed (15-minute increments)
  units: integer('units').notNull(),

  // Billing
  billingStatus: varchar('billing_status', { length: 20 }).default('pending'),
  // pending, submitted, approved, denied, paid
  billedAmount: decimal('billed_amount', { precision: 10, scale: 2 }),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }),
  insurancePaidAmount: decimal('insurance_paid_amount', { precision: 10, scale: 2 }),
  patientResponsibilityAmount: decimal('patient_responsibility_amount', { precision: 10, scale: 2 }),

  claimId: varchar('claim_id', { length: 100 }),
  claimSubmittedDate: date('claim_submitted_date'),
  claimPaidDate: date('claim_paid_date'),

  // Documentation
  progressNoteCompleted: boolean('progress_note_completed').default(false),
  progressNoteId: uuid('progress_note_id'), // FK to progress_notes (will add when that table exists)

  // Session quality/outcomes
  clientAttendance: varchar('client_attendance', { length: 20 }).notNull(),
  // present, late, no_show, cancelled
  clientEngagement: varchar('client_engagement', { length: 20 }),
  // high, medium, low
  goalsMet: integer('goals_met'),
  goalsTotal: integer('goals_total'),

  // Supervision (for trainees/RBTs)
  supervisorId: uuid('supervisor_id').references(() => therapists.id),
  supervisionType: varchar('supervision_type', { length: 20 }),
  // direct, indirect, remote

  // Notes (encrypted PHI)
  sessionSummary: text('session_summary_encrypted'),
  clinicalNotes: text('clinical_notes_encrypted'),

  // Signature
  signedBy: uuid('signed_by').references(() => users.id),
  signedAt: timestamp('signed_at'),
  isLocked: boolean('is_locked').default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => {
  return {
    tenantIdIdx: index('sessions_tenant_id_idx').on(table.tenantId),
    locationIdIdx: index('sessions_location_id_idx').on(table.locationId),
    appointmentIdIdx: index('sessions_appointment_id_idx').on(table.appointmentId),
    clientIdIdx: index('sessions_client_id_idx').on(table.clientId),
    therapistIdIdx: index('sessions_therapist_id_idx').on(table.therapistId),
    sessionDateIdx: index('sessions_session_date_idx').on(table.sessionDate),
    billingStatusIdx: index('sessions_billing_status_idx').on(table.billingStatus),
    therapistDateIdx: index('sessions_therapist_date_idx').on(table.therapistId, table.sessionDate),
    clientDateIdx: index('sessions_client_date_idx').on(table.clientId, table.sessionDate),
  };
});
