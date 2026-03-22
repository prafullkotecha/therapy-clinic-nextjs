import type { InferInsertModel } from 'drizzle-orm';
import { faker } from '@faker-js/faker';
import { db } from '@/libs/DB';
import { appointments } from '@/models/appointment.schema';
import { AppointmentStatus, AppointmentType } from '@/models/types';
import { formatDateForPostgres } from './helpers';

type NewAppointment = InferInsertModel<typeof appointments>;

export const appointmentFactory = {
  build(overrides?: Partial<NewAppointment>): NewAppointment {
    return {
      tenantId: faker.string.uuid(),
      locationId: faker.string.uuid(),
      clientId: faker.string.uuid(),
      therapistId: faker.string.uuid(),
      appointmentDate: formatDateForPostgres(new Date()),
      startTime: '10:00:00',
      endTime: '11:00:00',
      duration: 60,
      appointmentType: AppointmentType.REGULAR_SESSION,
      status: AppointmentStatus.SCHEDULED,
      ...overrides,
    };
  },

  async create(overrides?: Partial<NewAppointment>) {
    const [created] = await db.insert(appointments).values(this.build(overrides)).returning();
    if (!created) {
      throw new Error('Failed to create appointment');
    }
    return created;
  },

  async createBatch(count: number, overrides?: Partial<NewAppointment>) {
    const values = Array.from({ length: count }, () => this.build(overrides));
    return db.insert(appointments).values(values).returning();
  },
};
