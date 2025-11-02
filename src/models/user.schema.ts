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
