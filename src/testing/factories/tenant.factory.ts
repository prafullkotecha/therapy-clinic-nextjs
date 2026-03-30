import type { InferInsertModel } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import { db } from '@/libs/DB';
import { locations, tenants } from '@/models/tenant.schema';

type NewTenant = InferInsertModel<typeof tenants>;
type NewLocation = InferInsertModel<typeof locations>;

export const tenantFactory = {
  build(overrides?: Partial<NewTenant>): NewTenant {
    const name = faker.company.name();
    return {
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
      timezone: 'America/New_York',
      locale: 'en-US',
      primaryColor: '#10B981',
      plan: 'professional',
      status: 'active',
      ...overrides,
    };
  },

  async create(overrides?: Partial<NewTenant>) {
    const [created] = await db.insert(tenants).values(this.build(overrides)).returning();
    if (!created) {
      throw new Error('Failed to create tenant');
    }
    return created;
  },
};

export const locationFactory = {
  build(tenantId: string, overrides?: Partial<NewLocation>): NewLocation {
    return {
      tenantId,
      name: faker.company.name(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: 'MA',
      zipCode: faker.location.zipCode('#####'),
      phone: faker.phone.number(),
      isActive: true,
      ...overrides,
    };
  },

  async create(tenantId: string, overrides?: Partial<NewLocation>) {
    const [created] = await db
      .insert(locations)
      .values(this.build(tenantId, overrides))
      .returning();
    if (!created) {
      throw new Error('Failed to create location');
    }
    return created;
  },
};
