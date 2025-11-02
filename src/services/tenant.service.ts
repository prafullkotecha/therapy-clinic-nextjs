import { eq } from 'drizzle-orm';
import { setTenantContext, withTenantContext } from '@/lib/tenant-db';
import { db } from '@/libs/DB';
import { locations, tenants } from '@/models/tenant.schema';

/**
 * Tenant provisioning service
 * Handles tenant creation, updates, and management
 *
 * IMPORTANT: This service bypasses RLS for tenant creation/admin operations
 * Use with caution and only in controlled contexts (e.g., super admin operations)
 */

export type CreateTenantInput = {
  name: string;
  slug: string;
  timezone?: string;
  locale?: string;
  plan?: string;
  maxLocations?: number;
  maxTherapists?: number;
  maxActiveClients?: number;
  billingEmail?: string;
};

export type CreateLocationInput = {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
};

/**
 * Create a new tenant (clinic organization)
 * This is a privileged operation - no RLS context needed
 *
 * @param input - Tenant creation data
 * @returns Promise<Tenant> - The created tenant
 */
export async function createTenant(
  input: CreateTenantInput,
): Promise<typeof tenants.$inferSelect> {
  // Validate slug is unique
  const existing = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, input.slug));

  if (existing.length > 0) {
    throw new Error(`Tenant with slug "${input.slug}" already exists`);
  }

  const [tenant] = await db
    .insert(tenants)
    .values({
      name: input.name,
      slug: input.slug,
      timezone: input.timezone || 'America/New_York',
      locale: input.locale || 'en-US',
      plan: input.plan || 'standard',
      maxLocations: input.maxLocations || 5,
      maxTherapists: input.maxTherapists || 50,
      maxActiveClients: input.maxActiveClients || 500,
      billingEmail: input.billingEmail,
      status: 'active',
    })
    .returning();

  if (!tenant) {
    throw new Error('Failed to create tenant');
  }

  return tenant;
}

/**
 * Create a location for a tenant
 * Requires tenant context to be set
 *
 * @param tenantId - The tenant ID
 * @param input - Location creation data
 * @returns Promise<Location> - The created location
 */
export async function createLocation(
  tenantId: string,
  input: CreateLocationInput,
): Promise<typeof locations.$inferSelect> {
  return await withTenantContext(tenantId, async () => {
    // If this is marked as primary, unset other primary locations
    if (input.isPrimary) {
      await db
        .update(locations)
        .set({ isPrimary: false })
        .where(eq(locations.tenantId, tenantId));
    }

    const [location] = await db
      .insert(locations)
      .values({
        tenantId,
        name: input.name,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        phone: input.phone,
        email: input.email,
        isPrimary: input.isPrimary || false,
        isActive: true,
      })
      .returning();

    if (!location) {
      throw new Error('Failed to create location');
    }

    return location;
  });
}

/**
 * Get a tenant by ID
 * No RLS context needed for super admin operations
 *
 * @param tenantId - The tenant ID
 * @returns Promise<Tenant | null>
 */
export async function getTenantById(
  tenantId: string,
): Promise<typeof tenants.$inferSelect | null> {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  return tenant || null;
}

/**
 * Get a tenant by slug
 * Useful for tenant resolution during login
 *
 * @param slug - The tenant slug
 * @returns Promise<Tenant | null>
 */
export async function getTenantBySlug(
  slug: string,
): Promise<typeof tenants.$inferSelect | null> {
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, slug));

  return tenant || null;
}

/**
 * Get all locations for a tenant
 *
 * @param tenantId - The tenant ID
 * @returns Promise<Location[]>
 */
export async function getLocations(
  tenantId: string,
): Promise<Array<typeof locations.$inferSelect>> {
  return await withTenantContext(tenantId, async () => {
    return await db
      .select()
      .from(locations)
      .where(eq(locations.tenantId, tenantId));
  });
}

/**
 * Update tenant settings
 * Requires tenant context
 *
 * @param tenantId - The tenant ID
 * @param updates - Partial tenant data to update
 * @returns Promise<Tenant>
 */
export async function updateTenant(
  tenantId: string,
  updates: Partial<CreateTenantInput>,
): Promise<typeof tenants.$inferSelect> {
  // Set context for RLS
  await setTenantContext(tenantId);

  const [updated] = await db
    .update(tenants)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId))
    .returning();

  if (!updated) {
    throw new Error('Failed to update tenant');
  }

  return updated;
}

/**
 * Suspend a tenant (admin only)
 * This prevents all users in the tenant from accessing the system
 *
 * @param tenantId - The tenant ID
 * @returns Promise<void>
 */
export async function suspendTenant(tenantId: string): Promise<void> {
  await db
    .update(tenants)
    .set({ status: 'suspended', updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));
}

/**
 * Reactivate a tenant (admin only)
 *
 * @param tenantId - The tenant ID
 * @returns Promise<void>
 */
export async function reactivateTenant(tenantId: string): Promise<void> {
  await db
    .update(tenants)
    .set({ status: 'active', updatedAt: new Date() })
    .where(eq(tenants.id, tenantId));
}
