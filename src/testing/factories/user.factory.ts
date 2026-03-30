import type { InferInsertModel } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import { db } from '@/libs/DB';
import { UserRole } from '@/models/types';
import { users } from '@/models/user.schema';

type NewUser = InferInsertModel<typeof users>;

export const userFactory = {
  build(tenantId: string, overrides?: Partial<NewUser>): NewUser {
    return {
      tenantId,
      keycloakId: faker.string.uuid(),
      email: faker.internet.email().toLowerCase(),
      role: UserRole.THERAPIST,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: faker.phone.number(),
      assignedLocations: [],
      isActive: true,
      mfaEnabled: false,
      ...overrides,
    };
  },

  async create(tenantId: string, overrides?: Partial<NewUser>) {
    const [created] = await db.insert(users).values(this.build(tenantId, overrides)).returning();
    if (!created) {
      throw new Error('Failed to create user');
    }
    return created;
  },

  async createBatch(count: number, tenantId: string, overrides?: Partial<NewUser>) {
    const values = Array.from({ length: count }, () => this.build(tenantId, overrides));
    return db.insert(users).values(values).returning();
  },
};
