import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const getAuthContextMock = vi.fn();
const getAppointmentsMock = vi.fn();
const createAppointmentMock = vi.fn();

vi.mock('@/lib/auth-helpers', () => ({ getAuthContext: getAuthContextMock }));
vi.mock('@/services/appointment', () => ({
  getAppointments: getAppointmentsMock,
  createAppointment: createAppointmentMock,
}));

describe('/api/appointments route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns success response', async () => {
    const { GET } = await import('./route');
    getAuthContextMock.mockResolvedValue({
      tenantId: 'tenant-1',
      userId: 'user-1',
      isAuthenticated: true,
      hasPermission: () => true,
    });
    getAppointmentsMock.mockResolvedValueOnce([{ id: 'apt-1' }]);

    const request = { url: 'http://localhost/api/appointments' } as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(200);
  });

  it('GET returns unauthorized without session', async () => {
    const { GET } = await import('./route');
    getAuthContextMock.mockResolvedValue({ isAuthenticated: false, tenantId: null, userId: null, hasPermission: () => false });

    const request = { url: 'http://localhost/api/appointments' } as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('GET returns forbidden for wrong role', async () => {
    const { GET } = await import('./route');
    getAuthContextMock.mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1', isAuthenticated: true, hasPermission: () => false });

    const request = { url: 'http://localhost/api/appointments' } as NextRequest;
    const response = await GET(request);

    expect(response.status).toBe(403);
  });

  it('POST returns validation error', async () => {
    const { POST } = await import('./route');
    getAuthContextMock.mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1', isAuthenticated: true, hasPermission: () => true });

    const request = { json: vi.fn().mockResolvedValue({}) } as unknown as NextRequest;
    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
