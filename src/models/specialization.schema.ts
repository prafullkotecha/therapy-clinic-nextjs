import { boolean, index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';

// Specializations table - Therapy specializations taxonomy
// Categories:
// - behavioral_approach: ABA, CBT, DBT, EMDR, Play Therapy
// - communication: Non-verbal, AAC, Sign Language, Speech Integration
// - population: Autism, ADHD, Anxiety, Trauma, Developmental Delays
// - age_group: Early Childhood (0-5), School Age (6-12), Adolescent (13-17), Adult (18+)
// - modality: Individual, Family, Group
// - cultural: Languages, Cultural Backgrounds
export const specializations = pgTable('specializations', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id).notNull(),

  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    tenantIdIdx: index('specializations_tenant_id_idx').on(table.tenantId),
    categoryIdx: index('specializations_category_idx').on(table.category),
    isActiveIdx: index('specializations_is_active_idx').on(table.isActive),
  };
});
