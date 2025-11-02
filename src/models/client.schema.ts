import { date, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { locations, tenants } from './tenant.schema';
import { therapists } from './therapist.schema';
import { users } from './user.schema';

// Clients table - Contains PHI (encrypted fields)
export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  primaryLocationId: uuid('primary_location_id').references(() => locations.id),

  // Basic Info (ENCRYPTED with format: keyId:iv:authTag:ciphertext)
  firstName: text('first_name_encrypted').notNull(),
  lastName: text('last_name_encrypted').notNull(),
  dateOfBirth: text('date_of_birth_encrypted').notNull(),
  ssn: text('ssn_encrypted'), // Optional

  // Contact (ENCRYPTED)
  email: text('email_encrypted'),
  phone: text('phone_encrypted'),
  address: text('address_encrypted'),

  // Demographics (non-PHI, for matching)
  ageGroup: varchar('age_group', { length: 20 }),
  // early_childhood, school_age, adolescent, adult
  preferredLanguage: varchar('preferred_language', { length: 50 }),

  // Guardian (for minors) (ENCRYPTED)
  guardianName: text('guardian_name_encrypted'),
  guardianRelationship: varchar('guardian_relationship', { length: 50 }),
  guardianPhone: text('guardian_phone_encrypted'),
  guardianEmail: text('guardian_email_encrypted'),

  // Emergency Contact (ENCRYPTED)
  emergencyContactName: text('emergency_contact_name_encrypted'),
  emergencyContactPhone: text('emergency_contact_phone_encrypted'),
  emergencyContactRelationship: varchar('emergency_contact_relationship', { length: 50 }),

  // Insurance (ENCRYPTED)
  insuranceProvider: text('insurance_provider_encrypted'),
  insurancePolicyNumber: text('insurance_policy_number_encrypted'),
  insuranceGroupNumber: text('insurance_group_number_encrypted'),

  // Status
  status: varchar('status', { length: 20 }).default('intake'),
  // intake, active, inactive, discharged
  intakeDate: date('intake_date'),
  dischargeDate: date('discharge_date'),

  // Assignment
  assignedTherapistId: uuid('assigned_therapist_id').references(() => therapists.id),
  matchScore: integer('match_score'),
  matchReasoning: text('match_reasoning'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => {
  return {
    tenantIdIdx: index('clients_tenant_id_idx').on(table.tenantId),
    primaryLocationIdIdx: index('clients_primary_location_id_idx').on(table.primaryLocationId),
    assignedTherapistIdIdx: index('clients_assigned_therapist_id_idx').on(table.assignedTherapistId),
    statusIdx: index('clients_status_idx').on(table.status),
    ageGroupIdx: index('clients_age_group_idx').on(table.ageGroup),
  };
});

// Client needs table - Assessment and matching criteria
export const clientNeeds = pgTable('client_needs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),

  // Assessment (ENCRYPTED)
  primaryConcerns: text('primary_concerns_encrypted'),
  behavioralCharacteristics: text('behavioral_characteristics_encrypted'),
  sensoryConsiderations: text('sensory_considerations_encrypted'),

  // Needs (non-encrypted for matching)
  communicationNeeds: varchar('communication_needs', { length: 50 }),
  // verbal, non_verbal, aac, sign_language
  cooccurringConditions: jsonb('cooccurring_conditions'),

  // Required Specializations (for matching algorithm)
  // [{ specializationId, specializationName, importance: 'critical' | 'preferred' | 'nice_to_have' }]
  requiredSpecializations: jsonb('required_specializations'),

  // Preferences
  preferredTherapyModality: varchar('preferred_therapy_modality', { length: 20 }),
  // { preferredDays: ['Monday', 'Wednesday'], preferredTimes: ['morning'] }
  schedulePreferences: jsonb('schedule_preferences'),

  // Priority
  urgencyLevel: varchar('urgency_level', { length: 20 }).default('standard'),
  // urgent, high, standard, low

  assessmentDate: timestamp('assessment_date').defaultNow().notNull(),
  assessedBy: uuid('assessed_by').references(() => users.id),
  nextReassessment: date('next_reassessment'),
}, (table) => {
  return {
    tenantIdIdx: index('client_needs_tenant_id_idx').on(table.tenantId),
    clientIdIdx: index('client_needs_client_id_idx').on(table.clientId),
    urgencyLevelIdx: index('client_needs_urgency_level_idx').on(table.urgencyLevel),
  };
});
