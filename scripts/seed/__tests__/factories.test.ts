import { describe, expect, it } from 'vitest';
import { appointmentFactory } from '../factories/appointment.factory';
import { clientFactory } from '../factories/client.factory';
import { therapistFactory } from '../factories/therapist.factory';
import { locationFactory, tenantFactory } from '../factories/tenant.factory';
import { userFactory } from '../factories/user.factory';

describe('seed factories', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const locationId = '00000000-0000-0000-0000-000000000002';
  const userId = '00000000-0000-0000-0000-000000000003';
  const clientId = '00000000-0000-0000-0000-000000000004';
  const therapistId = '00000000-0000-0000-0000-000000000005';

  it('builds tenant/location defaults', () => {
    const tenant = tenantFactory.build();
    const location = locationFactory.build(tenantId);
    expect(tenant.name).toBeTruthy();
    expect(location.tenantId).toBe(tenantId);
  });

  it('builds user/client/therapist with required fields', () => {
    const user = userFactory.build(tenantId);
    const client = clientFactory.build({ tenantId, primaryLocationId: locationId });
    const therapist = therapistFactory.build({ tenantId, userId, primaryLocationId: locationId });

    expect(user.tenantId).toBe(tenantId);
    expect(client.primaryLocationId).toBe(locationId);
    expect(therapist.userId).toBe(userId);
  });

  it('builds appointment with linked ids', () => {
    const appointment = appointmentFactory.build({ tenantId, locationId, clientId, therapistId });
    expect(appointment.tenantId).toBe(tenantId);
    expect(appointment.clientId).toBe(clientId);
    expect(appointment.therapistId).toBe(therapistId);
  });
});
