import { describe, expect, it, vi } from 'vitest';

vi.mock('@/libs/Logger', () => ({ logger: { info: vi.fn() } }));

describe('notification.service', () => {
  it('sendNotification returns true happy path', async () => {
    const { sendNotification } = await import('../notification.service');
    const result = await sendNotification({ recipientId: 'user-1', subject: 'Hello', message: 'World', type: 'email' });
    expect(result).toBe(true);
  });

  it('sendWaitlistNotification returns true for edge input', async () => {
    const { sendWaitlistNotification } = await import('../notification.service');
    const result = await sendWaitlistNotification('client-1', 'Therapist', '2026-03-30', '09:00', '10:00');
    expect(result).toBe(true);
  });

  it('sendNotification handles metadata payload', async () => {
    const { sendNotification } = await import('../notification.service');
    const result = await sendNotification({ recipientId: 'user-1', subject: 'Meta', message: 'Body', type: 'sms', metadata: { a: 1 } });
    expect(result).toBe(true);
  });
});
