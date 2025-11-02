import { boolean, index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';

// Users table - Staff members across all tenants
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  keycloakId: varchar('keycloak_id', { length: 255 }).unique().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  // admin, therapist, billing, receptionist

  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),

  // Location assignment (can work at multiple locations)
  // Array of location IDs
  assignedLocations: jsonb('assigned_locations'),

  isActive: boolean('is_active').default(true),
  isLocked: boolean('is_locked').default(false),
  lastLoginAt: timestamp('last_login_at'),
  mfaEnabled: boolean('mfa_enabled').default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdIdx: index('users_tenant_id_idx').on(table.tenantId),
    keycloakIdIdx: index('users_keycloak_id_idx').on(table.keycloakId),
    emailIdx: index('users_email_idx').on(table.email),
  };
});

// Audit logs table - Tracks all PHI access and sensitive operations
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  resource: varchar('resource', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),

  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  phiAccessed: boolean('phi_accessed').default(false),
  changes: jsonb('changes'),

  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdIdx: index('audit_logs_tenant_id_idx').on(table.tenantId),
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
    resourceIdx: index('audit_logs_resource_idx').on(table.resource, table.resourceId),
    phiAccessedIdx: index('audit_logs_phi_accessed_idx').on(table.phiAccessed),
  };
});

// Failed login attempts table - Tracks failed authentication attempts for security
// Used for account lockout and brute force detection
export const failedLoginAttempts = pgTable('failed_login_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  // Identifier - can be email, keycloakId, or username
  identifier: varchar('identifier', { length: 255 }).notNull(),
  identifierType: varchar('identifier_type', { length: 50 }).notNull(),
  // email, keycloak_id, username

  // Request details
  ipAddress: varchar('ip_address', { length: 45 }).notNull(),
  userAgent: text('user_agent'),

  // Attempt details
  attemptedAt: timestamp('attempted_at').defaultNow().notNull(),
  failureReason: varchar('failure_reason', { length: 100 }),
  // invalid_credentials, account_locked, account_disabled, mfa_failed

  // Cleanup tracking
  expiresAt: timestamp('expires_at').notNull(),
  // Auto-expire after configured period (e.g., 15 minutes)
}, (table) => {
  return {
    tenantIdIdx: index('failed_login_attempts_tenant_id_idx').on(table.tenantId),
    identifierIdx: index('failed_login_attempts_identifier_idx').on(table.identifier),
    ipAddressIdx: index('failed_login_attempts_ip_address_idx').on(table.ipAddress),
    attemptedAtIdx: index('failed_login_attempts_attempted_at_idx').on(table.attemptedAt),
    expiresAtIdx: index('failed_login_attempts_expires_at_idx').on(table.expiresAt),
    // Composite index for common query pattern: check recent attempts by identifier
    identifierTimeIdx: index('failed_login_attempts_identifier_time_idx').on(table.identifier, table.attemptedAt),
  };
});
