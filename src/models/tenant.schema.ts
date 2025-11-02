import { boolean, date, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// Tenants table - Clinic organizations
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).unique().notNull(),

  // Settings
  timezone: varchar('timezone', { length: 50 }).default('America/New_York'),
  locale: varchar('locale', { length: 10 }).default('en-US'),

  // Branding
  logo: text('logo_url'),
  primaryColor: varchar('primary_color', { length: 7 }).default('#3B82F6'),

  // Subscription
  plan: varchar('plan', { length: 50 }).default('standard'),
  status: varchar('status', { length: 20 }).default('active'),
  // active, suspended, cancelled
  maxLocations: integer('max_locations').default(5),
  maxTherapists: integer('max_therapists').default(50),
  maxActiveClients: integer('max_active_clients').default(500),

  // Billing
  billingEmail: varchar('billing_email', { length: 255 }),
  subscriptionStart: date('subscription_start'),
  subscriptionEnd: date('subscription_end'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Locations table - Physical clinic locations
export const locations = pgTable('locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 2 }),
  zipCode: varchar('zip_code', { length: 10 }),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),

  // Operating hours (JSON)
  // { monday: { open: '09:00', close: '17:00' }, ... }
  operatingHours: jsonb('operating_hours'),

  isActive: boolean('is_active').default(true),
  isPrimary: boolean('is_primary').default(false),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
