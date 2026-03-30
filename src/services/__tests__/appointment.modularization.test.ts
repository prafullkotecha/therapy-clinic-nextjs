import { describe, expect, it } from 'vitest';

describe('appointment modularization exports', () => {
  it('re-exports create/read/update/cancel/waitlist functions', async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/test';

    const index = await import('@/services/appointment');
    const create = await import('@/services/appointment/create');
    const read = await import('@/services/appointment/read');
    const update = await import('@/services/appointment/update');
    const cancel = await import('@/services/appointment/cancel');
    const waitlist = await import('@/services/appointment/waitlist');

    expect(create.createAppointment).toBe(index.createAppointment);
    expect(read.getAppointments).toBe(index.getAppointments);
    expect(read.getAppointmentById).toBe(index.getAppointmentById);
    expect(update.updateAppointment).toBe(index.updateAppointment);
    expect(update.rescheduleAppointment).toBe(index.rescheduleAppointment);
    expect(cancel.cancelAppointment).toBe(index.cancelAppointment);
    expect(waitlist.addToWaitlist).toBe(index.addToWaitlist);
    expect(waitlist.processWaitlist).toBe(index.processWaitlist);
  });
});
