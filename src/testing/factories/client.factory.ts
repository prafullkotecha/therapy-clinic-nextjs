import type { InferInsertModel } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import { getEncryptionServiceSync } from '@/lib/encryption';
import { db } from '@/libs/DB';
import { clients } from '@/models/client.schema';
import { AgeGroup, ClientStatus } from '@/models/types';
import { formatDateForPostgres } from './helpers';

type NewClient = InferInsertModel<typeof clients>;

export const clientFactory = {
  build(overrides?: Partial<NewClient>): NewClient {
    const encryption = getEncryptionServiceSync();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      tenantId: faker.string.uuid(),
      primaryLocationId: faker.string.uuid(),
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

  async create(overrides?: Partial<NewClient>) {
    const [created] = await db.insert(clients).values(this.build(overrides)).returning();
    if (!created) {
      throw new Error('Failed to create client');
    }
    return created;
  },

  async createBatch(count: number, overrides?: Partial<NewClient>) {
    const values = Array.from({ length: count }, () => this.build(overrides));
    return db.insert(clients).values(values).returning();
  },
};
