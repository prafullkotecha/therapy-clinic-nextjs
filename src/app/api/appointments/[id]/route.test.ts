import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const getAuthContextMock = vi.fn();
const getAppointmentByIdMock = vi.fn();
const updateAppointmentMock = vi.fn();
const cancelAppointmentMock = vi.fn();

vi.mock('@/lib/auth-helpers', () => ({ getAuthContext: getAuthContextMock }));
vi.mock('@/services/appointment', () => ({
  getAppointmentById: getAppointmentByIdMock,
  updateAppointment: updateAppointmentMock,
  cancelAppointment: cancelAppointmentMock,
}));

describe('/api/appointments/[id] route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns success response', async () => {
    const { GET } = await import('./route');
    getAuthContextMock.mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1', isAuthenticated: true, hasPermission: () => true });
    getAppointmentByIdMock.mockResolvedValueOnce({ id: 'apt-1' });

    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: 'apt-1' }) });
    expect(response.status).toBe(200);
  });

  it('PATCH returns unauthorized without session', async () => {
    const { PATCH } = await import('./route');
    getAuthContextMock.mockResolvedValue({ isAuthenticated: false, tenantId: null, userId: null, hasPermission: () => false });

    const request = { json: vi.fn().mockResolvedValue({}) } as unknown as NextRequest;
    const response = await PATCH(request, { params: Promise.resolve({ id: 'apt-1' }) });
    expect(response.status).toBe(401);
  });

  it('DELETE returns forbidden for wrong role', async () => {
    const { DELETE } = await import('./route');
    getAuthContextMock.mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1', isAuthenticated: true, hasPermission: () => false });

    const response = await DELETE({} as NextRequest, { params: Promise.resolve({ id: 'apt-1' }) });
    expect(response.status).toBe(403);
  });

  it('PATCH returns validation error', async () => {
    const { PATCH } = await import('./route');
    getAuthContextMock.mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1', isAuthenticated: true, hasPermission: () => true });

    const request = { json: vi.fn().mockResolvedValue({ appointmentDate: 'bad-date' }) } as unknown as NextRequest;
    const response = await PATCH(request, { params: Promise.resolve({ id: 'apt-1' }) });
    expect(response.status).toBe(400);
  });
});
