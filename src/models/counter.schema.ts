import { integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';

// Counter table - Demo/testing table from boilerplate
// This table is used for the counter example in the boilerplate
export const counterSchema = pgTable('counter', {
  id: serial('id').primaryKey(),
  count: integer('count').default(0),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});
