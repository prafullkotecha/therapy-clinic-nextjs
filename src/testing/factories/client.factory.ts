import type { InferInsertModel } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import { getEncryptionServiceSync } from '@/lib/encryption';
import { db } from '@/libs/DB';
import { clients } from '@/models/client.schema';
import { AgeGroup, ClientStatus } from '@/models/types';
import { formatDateForPostgres } from './helpers';

type NewClient = InferInsertModel<typeof clients>;

export const clientFactory = {
  build(input: {
    tenantId: string;
    primaryLocationId: string;
    overrides?: Partial<NewClient>;
  }): NewClient {
    const { tenantId, primaryLocationId, overrides } = input;
    const encryption = getEncryptionServiceSync();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      tenantId,
      primaryLocationId,
      firstName: encryption.encrypt(firstName),
      lastName: encryption.encrypt(lastName),
      dateOfBirth: encryption.encrypt(formatDateForPostgres(faker.date.birthdate())),
      email: encryption.encrypt(faker.internet.email().toLowerCase()),
      phone: encryption.encrypt(faker.phone.number()),
      address: encryption.encrypt(faker.location.streetAddress()),
      ageGroup: AgeGroup.SCHOOL_AGE,
      status: ClientStatus.ACTIVE,
      intakeDate: formatDateForPostgres(new Date()),
      ...overrides,
    };
  },

  async create(input: {
    tenantId: string;
    primaryLocationId: string;
    overrides?: Partial<NewClient>;
  }) {
    const [created] = await db.insert(clients).values(this.build(input)).returning();
    if (!created) {
      throw new Error('Failed to create client');
    }
    return created;
  },

  async createBatch(
    count: number,
    input: {
      tenantId: string;
      primaryLocationId: string;
      overrides?: Partial<NewClient>;
    },
  ) {
    const values = Array.from({ length: count }, () => this.build(input));
    return db.insert(clients).values(values).returning();
  },
};
