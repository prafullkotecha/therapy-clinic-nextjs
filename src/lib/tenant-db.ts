import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@/models/Schema';
import { sql } from 'drizzle-orm';
import { db } from '@/libs/DB';

/**
 * Tenant-aware database interface
 * Ensures all queries are scoped to the current tenant via PostgreSQL RLS
 */

/**
 * Set the tenant context for Row-Level Security
 * This MUST be called before any tenant-specific queries
 *
 * @param tenantId - The UUID of the tenant
 * @returns Promise that resolves when context is set
 */
export async function setTenantContext(
  tenantId: string,
): Promise<void> {
  if (!tenantId) {
    throw new Error('Tenant ID is required for tenant context');
  }

  // Validate UUID format to prevent SQL injection
  const uuidRegex
    = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
  if (!uuidRegex.test(tenantId)) {
    throw new Error('Invalid tenant ID format');
  }

  // Set the PostgreSQL session variable for RLS policies
  // Using ::uuid cast allows PostgreSQL to accept parameterized query
  await db.execute(sql`SET LOCAL app.current_tenant = ${tenantId}::uuid`);
}

/**
 * Clear the tenant context (useful for testing or cleanup)
 * In production, this should rarely be needed as contexts are transaction-scoped
 */
export async function clearTenantContext(): Promise<void> {
  await db.execute(sql`RESET app.current_tenant`);
}

/**
 * Execute a database operation with tenant context automatically set
 * Recommended for use in API routes and server actions
 *
 * @param tenantId - The UUID of the tenant
 * @param operation - The database operation to execute
 * @returns Promise with the result of the operation
 *
 * @example
 * const clients = await withTenantContext(tenantId, async (db) => {
 *   return await db.select().from(clientsTable);
 * });
 */
export async function withTenantContext<T>(
  tenantId: string,
  operation: (db: NodePgDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
  await setTenantContext(tenantId);
  try {
    return await operation(db);
  } finally {
    // Context is automatically cleared at transaction end
    // but we can explicitly reset if needed
  }
}

/**
 * Get the current tenant context (for debugging/testing)
 * @returns Promise<string | null> - The current tenant ID or null
 */
export async function getCurrentTenantContext(): Promise<string | null> {
  const result = await db.execute(
    sql`SELECT current_setting('app.current_tenant', true) as tenant_id`,
  );

  const row = result.rows[0] as { tenant_id: string | null } | undefined;
  return row?.tenant_id || null;
}
