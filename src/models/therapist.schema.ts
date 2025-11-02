import { boolean, date, index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { specializations } from './specialization.schema';
import { locations, tenants } from './tenant.schema';
import { users } from './user.schema';

// Therapists table
export const therapists = pgTable('therapists', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  userId: uuid('user_id').references(() => users.id).notNull(),
  primaryLocationId: uuid('primary_location_id').references(() => locations.id),

  // Credentials
  licenseNumber: varchar('license_number', { length: 100 }),
  licenseState: varchar('license_state', { length: 2 }),
  licenseExpirationDate: date('license_expiration_date'),
  credentials: varchar('credentials', { length: 255 }), // BCBA, LCSW, LPC, etc.

  bio: text('bio'),
  photoUrl: text('photo_url'),

  // Caseload
  maxCaseload: integer('max_caseload').default(25),
  currentCaseload: integer('current_caseload').default(0),
  isAcceptingNewClients: boolean('is_accepting_new_clients').default(true),

  // Capabilities
  languages: jsonb('languages'), // ['English', 'Spanish']
  ageGroupExpertise: jsonb('age_group_expertise'), // ['early_childhood', 'school_age']
  communicationExpertise: jsonb('communication_expertise'), // ['non-verbal', 'aac']

  // Availability template (JSON)
  // { monday: [{ start: '09:00', end: '17:00' }], ... }
  availability: jsonb('availability'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdIdx: index('therapists_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('therapists_user_id_idx').on(table.userId),
    primaryLocationIdIdx: index('therapists_primary_location_id_idx').on(table.primaryLocationId),
    isAcceptingNewClientsIdx: index('therapists_is_accepting_new_clients_idx').on(table.isAcceptingNewClients),
  };
});

// Therapist specializations junction table
export const therapistSpecializations = pgTable('therapist_specializations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),
  specializationId: uuid('specialization_id').references(() => specializations.id).notNull(),
  proficiencyLevel: varchar('proficiency_level', { length: 20 }).notNull(),
  // expert, proficient, familiar
  yearsExperience: integer('years_experience'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdIdx: index('therapist_specializations_tenant_id_idx').on(table.tenantId),
    therapistIdIdx: index('therapist_specializations_therapist_id_idx').on(table.therapistId),
    specializationIdIdx: index('therapist_specializations_specialization_id_idx').on(table.specializationId),
  };
});
