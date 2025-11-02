import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  clearTenantContext,
  getCurrentTenantContext,
  setTenantContext,
  withTenantContext,
} from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { locations, tenants } from '@/models/tenant.schema';

/**
 * Tenant Isolation Tests
 *
 * These tests verify that Row-Level Security policies properly isolate tenant data
 *
 * IMPORTANT: These tests require a PostgreSQL database with RLS policies enabled
 * Run migrations before executing these tests
 */

describe('Tenant Isolation (RLS)', () => {
  let tenant1Id: string;
  let tenant2Id: string;
  let location1Id: string;
  let location2Id: string;

  beforeAll(async () => {
    // Create two test tenants
    const [tenant1] = await db
      .insert(tenants)
      .values({
        name: 'Test Clinic 1',
        slug: 'test-clinic-1',
      })
      .returning();

    const [tenant2] = await db
      .insert(tenants)
      .values({
        name: 'Test Clinic 2',
        slug: 'test-clinic-2',
      })
      .returning();

    if (!tenant1 || !tenant2) {
      throw new Error('Failed to create test tenants');
    }

    tenant1Id = tenant1.id;
    tenant2Id = tenant2.id;

    // Create locations for each tenant
    await setTenantContext(tenant1Id);
    const [loc1] = await db
      .insert(locations)
      .values({
        tenantId: tenant1Id,
        name: 'Location 1',
        isPrimary: true,
      })
      .returning();

    await setTenantContext(tenant2Id);
    const [loc2] = await db
      .insert(locations)
      .values({
        tenantId: tenant2Id,
        name: 'Location 2',
        isPrimary: true,
      })
      .returning();

    if (!loc1 || !loc2) {
      throw new Error('Failed to create test locations');
    }

    location1Id = loc1.id;
    location2Id = loc2.id;

    await clearTenantContext();
  });

  afterAll(async () => {
    // Cleanup test data
    await clearTenantContext();

    // Delete test tenants (cascade will delete related records)
    await db.delete(tenants).where(eq(tenants.id, tenant1Id));
    await db.delete(tenants).where(eq(tenants.id, tenant2Id));
  });

  it('should set and retrieve tenant context', async () => {
    await setTenantContext(tenant1Id);
    const context = await getCurrentTenantContext();

    expect(context).toBe(tenant1Id);

    await clearTenantContext();
  });

  it('should only return locations for the current tenant', async () => {
    // Set context to tenant 1
    await setTenantContext(tenant1Id);

    const tenant1Locations = await db
      .select()
      .from(locations)
      .where(eq(locations.tenantId, tenant1Id));

    // Should only see tenant 1's locations
    expect(tenant1Locations).toHaveLength(1);
    expect(tenant1Locations[0]?.id).toBe(location1Id);

    // Switch to tenant 2
    await setTenantContext(tenant2Id);

    const tenant2Locations = await db
      .select()
      .from(locations)
      .where(eq(locations.tenantId, tenant2Id));

    // Should only see tenant 2's locations
    expect(tenant2Locations).toHaveLength(1);
    expect(tenant2Locations[0]?.id).toBe(location2Id);

    await clearTenantContext();
  });

  it('should prevent cross-tenant data access with RLS', async () => {
    // Set context to tenant 1
    await setTenantContext(tenant1Id);

    // Try to query locations - RLS should filter to only tenant 1
    const allLocations = await db.select().from(locations);

    // Should only see tenant 1's location despite querying all
    expect(allLocations).toHaveLength(1);
    expect(allLocations[0]?.tenantId).toBe(tenant1Id);

    await clearTenantContext();
  });

  it('should work with withTenantContext helper', async () => {
    const result = await withTenantContext(tenant1Id, async () => {
      const locs = await db.select().from(locations);
      return locs;
    });

    // Should only see tenant 1's locations
    expect(result).toHaveLength(1);
    expect(result[0]?.tenantId).toBe(tenant1Id);
  });

  it('should throw error for invalid tenant ID', async () => {
    await expect(setTenantContext('invalid-uuid')).rejects.toThrow(
      'Invalid tenant ID format',
    );
  });

  it('should throw error for empty tenant ID', async () => {
    await expect(setTenantContext('')).rejects.toThrow(
      'Tenant ID is required',
    );
  });
});
