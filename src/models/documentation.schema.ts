import { boolean, date, index, integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { appointments } from './appointment.schema';
import { clients } from './client.schema';
import { tenants } from './tenant.schema';
import { therapists } from './therapist.schema';
import { users } from './user.schema';

// Progress notes table - SOAP format session notes (ALL ENCRYPTED)
export const progressNotes = pgTable('progress_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  appointmentId: uuid('appointment_id').references(() => appointments.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),

  // SOAP Format (ALL ENCRYPTED)
  subjective: text('subjective_encrypted'),
  objective: text('objective_encrypted'),
  assessment: text('assessment_encrypted'),
  plan: text('plan_encrypted'),

  interventions: text('interventions_encrypted'),
  clientResponse: text('client_response_encrypted'),
  homework: text('homework_encrypted'),

  sessionDuration: integer('session_duration'), // minutes
  noteDate: date('note_date').notNull(),

  // Signatures
  signedBy: uuid('signed_by').references(() => users.id),
  signedAt: timestamp('signed_at'),
  digitalSignature: text('digital_signature'),
  isLocked: boolean('is_locked').default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdIdx: index('progress_notes_tenant_id_idx').on(table.tenantId),
    appointmentIdIdx: index('progress_notes_appointment_id_idx').on(table.appointmentId),
    clientIdIdx: index('progress_notes_client_id_idx').on(table.clientId),
    therapistIdIdx: index('progress_notes_therapist_id_idx').on(table.therapistId),
    noteDateIdx: index('progress_notes_note_date_idx').on(table.noteDate),
  };
});

// Treatment plans table - Client treatment plans (ENCRYPTED)
export const treatmentPlans = pgTable('treatment_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  clientId: uuid('client_id').references(() => clients.id).notNull(),
  therapistId: uuid('therapist_id').references(() => therapists.id).notNull(),

  // Plan (ENCRYPTED)
  diagnosis: text('diagnosis_encrypted'),
  goals: text('goals_encrypted'),
  objectives: text('objectives_encrypted'),
  interventions: text('interventions_encrypted'),

  startDate: date('start_date').notNull(),
  reviewDate: date('review_date'),
  endDate: date('end_date'),

  status: varchar('status', { length: 20 }).default('active'),
  // draft, active, under_review, completed, discontinued

  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdIdx: index('treatment_plans_tenant_id_idx').on(table.tenantId),
    clientIdIdx: index('treatment_plans_client_id_idx').on(table.clientId),
    therapistIdIdx: index('treatment_plans_therapist_id_idx').on(table.therapistId),
    statusIdx: index('treatment_plans_status_idx').on(table.status),
  };
});

// Consent forms table - HIPAA and other consents
export const consentForms = pgTable('consent_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),

  consentType: varchar('consent_type', { length: 50 }).notNull(),
  // hipaa_authorization, treatment_consent, telehealth_consent, photo_video_release
  version: varchar('version', { length: 20 }).notNull(),

  consentGiven: boolean('consent_given').notNull(),
  consentDate: date('consent_date').notNull(),
  expirationDate: date('expiration_date'),

  signedBy: varchar('signed_by', { length: 100 }),
  signerRelationship: varchar('signer_relationship', { length: 50 }),
  // self, parent, guardian, legal_representative
  digitalSignature: text('digital_signature'),
  ipAddress: varchar('ip_address', { length: 45 }),

  documentUrl: text('document_url'), // S3 key (encrypted)

  status: varchar('status', { length: 20 }).default('active'),
  // active, expired, withdrawn, superseded

  withdrawnAt: timestamp('withdrawn_at'),
  withdrawnBy: uuid('withdrawn_by').references(() => users.id),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdIdx: index('consent_forms_tenant_id_idx').on(table.tenantId),
    clientIdIdx: index('consent_forms_client_id_idx').on(table.clientId),
    consentTypeIdx: index('consent_forms_consent_type_idx').on(table.consentType),
    statusIdx: index('consent_forms_status_idx').on(table.status),
  };
});

// Documents table - File uploads (S3)
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id),

  documentType: varchar('document_type', { length: 50 }).notNull(),
  // assessment, referral, medical_record, insurance, consent, other

  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),

  // S3 storage
  s3Bucket: varchar('s3_bucket', { length: 100 }),
  s3Key: text('s3_key'), // Encrypted at rest in S3
  s3VersionId: varchar('s3_version_id', { length: 255 }),

  uploadedBy: uuid('uploaded_by').references(() => users.id).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),

  // Access tracking
  lastAccessedAt: timestamp('last_accessed_at'),
  lastAccessedBy: uuid('last_accessed_by').references(() => users.id),

  isArchived: boolean('is_archived').default(false),
  archivedAt: timestamp('archived_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdIdx: index('documents_tenant_id_idx').on(table.tenantId),
    clientIdIdx: index('documents_client_id_idx').on(table.clientId),
    documentTypeIdx: index('documents_document_type_idx').on(table.documentType),
    uploadedByIdx: index('documents_uploaded_by_idx').on(table.uploadedBy),
    isArchivedIdx: index('documents_is_archived_idx').on(table.isArchived),
  };
});
