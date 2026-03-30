import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { clients } from './client.schema';
import { tenants } from './tenant.schema';
import { users } from './user.schema';

export const consents = pgTable('consents', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),
  clientId: uuid('client_id').references(() => clients.id).notNull(),
  consentType: varchar('consent_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  grantedAt: timestamp('granted_at').defaultNow().notNull(),
  revokedAt: timestamp('revoked_at'),
  expiresAt: timestamp('expires_at'),
  documentVersion: varchar('document_version', { length: 50 }).notNull(),
  signatureHash: text('signature_hash').notNull(),
  witnessUserId: uuid('witness_user_id').references(() => users.id),
  revocationReason: text('revocation_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, table => ({
  tenantIdIdx: index('consents_tenant_id_idx').on(table.tenantId),
  clientIdIdx: index('consents_client_id_idx').on(table.clientId),
  consentTypeIdx: index('consents_consent_type_idx').on(table.consentType),
  statusIdx: index('consents_status_idx').on(table.status),
}));

export type ConsentType = 'treatment' | 'data_sharing' | 'telehealth' | 'research';
export type ConsentStatus = 'active' | 'revoked' | 'expired';
