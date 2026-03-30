import type { InferInsertModel } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import { db } from '@/libs/DB';
import { therapists } from '@/models/therapist.schema';

type NewTherapist = InferInsertModel<typeof therapists>;

export const therapistFactory = {
  build(input: {
    tenantId: string;
    userId: string;
    primaryLocationId: string;
    overrides?: Partial<NewTherapist>;
  }): NewTherapist {
    const { tenantId, userId, primaryLocationId, overrides } = input;
    return {
      tenantId,
      userId,
      primaryLocationId,
      licenseNumber: faker.string.alphanumeric(8).toUpperCase(),
      licenseState: 'MA',
      credentials: 'LCSW',
      maxCaseload: 25,
      currentCaseload: 0,
      isAcceptingNewClients: true,
      availability: {
        monday: [{ start: '09:00', end: '17:00' }],
      },
      ...overrides,
    };
  },

  async create(input: {
    tenantId: string;
    userId: string;
    primaryLocationId: string;
    overrides?: Partial<NewTherapist>;
  }) {
    const [created] = await db.insert(therapists).values(this.build(input)).returning();
    if (!created) {
      throw new Error('Failed to create therapist');
    }
    return created;
  },

  async createBatch(
    count: number,
    input: {
      tenantId: string;
      userId: string;
      primaryLocationId: string;
      overrides?: Partial<NewTherapist>;
    },
  ) {
    const values = Array.from({ length: count }, () => this.build(input));
    return db.insert(therapists).values(values).returning();
  },
};
