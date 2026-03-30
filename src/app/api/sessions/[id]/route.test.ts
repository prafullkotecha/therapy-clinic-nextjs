import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const getAuthContextMock = vi.fn();
const getSessionNoteMock = vi.fn();
const updateSessionNoteMock = vi.fn();

vi.mock('@/lib/auth-helpers', () => ({ getAuthContext: getAuthContextMock }));
vi.mock('@/services/session.service', () => ({
  getSessionNote: getSessionNoteMock,
  updateSessionNote: updateSessionNoteMock,
}));

describe('/api/sessions/[id] route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns success response', async () => {
    const { GET } = await import('./route');
    getAuthContextMock.mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1', isAuthenticated: true, hasPermission: () => true });
    getSessionNoteMock.mockResolvedValueOnce({ id: 'note-1' });

    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: 'note-1' }) });
    expect(response.status).toBe(200);
  });

  it('GET returns unauthorized without session', async () => {
    const { GET } = await import('./route');
    getAuthContextMock.mockResolvedValue({ isAuthenticated: false, tenantId: null, userId: null, hasPermission: () => false });

    const response = await GET({} as NextRequest, { params: Promise.resolve({ id: 'note-1' }) });
    expect(response.status).toBe(401);
  });

  it('PATCH returns forbidden for wrong role', async () => {
    const { PATCH } = await import('./route');
    getAuthContextMock.mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1', isAuthenticated: true, hasPermission: () => false });

    const request = { json: vi.fn().mockResolvedValue({}) } as unknown as NextRequest;
    const response = await PATCH(request, { params: Promise.resolve({ id: 'note-1' }) });
    expect(response.status).toBe(403);
  });

  it('PATCH returns validation error', async () => {
    const { PATCH } = await import('./route');
    getAuthContextMock.mockResolvedValue({ tenantId: 'tenant-1', userId: 'user-1', isAuthenticated: true, hasPermission: () => true });

    const request = { json: vi.fn().mockResolvedValue({ clientAttendance: '' }) } as unknown as NextRequest;
    const response = await PATCH(request, { params: Promise.resolve({ id: 'note-1' }) });
    expect(response.status).toBe(400);
  });
});
