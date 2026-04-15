import type { InferInsertModel } from 'drizzle-orm';
import { db } from '@/libs/DB';
import { appointments } from '@/models/appointment.schema';
import { AppointmentStatus, AppointmentType } from '@/models/types';
import { formatDateForPostgres } from './helpers';

type NewAppointment = InferInsertModel<typeof appointments>;

export const appointmentFactory = {
  build(input: {
    tenantId: string;
    locationId: string;
    clientId: string;
    therapistId: string;
    overrides?: Partial<NewAppointment>;
  }): NewAppointment {
    const {
      tenantId,
      locationId,
      clientId,
      therapistId,
      overrides,
    } = input;
    return {
      tenantId,
      locationId,
      clientId,
      therapistId,
      appointmentDate: formatDateForPostgres(new Date()),
      startTime: '10:00:00',
      endTime: '11:00:00',
      duration: 60,
      appointmentType: AppointmentType.REGULAR_SESSION,
      status: AppointmentStatus.SCHEDULED,
      ...overrides,
    };
  },

  async create(input: {
    tenantId: string;
    locationId: string;
    clientId: string;
    therapistId: string;
    overrides?: Partial<NewAppointment>;
  }) {
    const [created] = await db.insert(appointments).values(this.build(input)).returning();
    if (!created) {
      throw new Error('Failed to create appointment');
    }
    return created;
  },

  async createBatch(
    count: number,
    input: {
      tenantId: string;
      locationId: string;
      clientId: string;
      therapistId: string;
      overrides?: Partial<NewAppointment>;
    },
  ) {
    const values = Array.from({ length: count }, () => this.build(input));
    return db.insert(appointments).values(values).returning();
  },
};
