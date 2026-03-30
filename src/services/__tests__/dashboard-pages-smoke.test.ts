import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth-helpers', () => ({
  getAuthContext: vi.fn().mockResolvedValue({
    tenantId: 'tenant-1',
    userId: 'user-1',
    isAuthenticated: true,
    hasPermission: () => true,
  }),
}));
vi.mock('@/services/client.service', () => ({ listClients: vi.fn().mockResolvedValue([]) }));
vi.mock('@/services/appointment', () => ({ getAppointments: vi.fn().mockResolvedValue([]) }));
vi.mock('@/services/session.service', () => ({
  getSessionNotes: vi.fn().mockResolvedValue([]),
  getSessionNote: vi.fn().mockResolvedValue(null),
}));

describe('new dashboard page modules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads all newly added page modules', async () => {
    const adminClientsPage = await import('@/app/[locale]/(dashboard)/admin/clients/page');
    const adminAppointmentsPage = await import('@/app/[locale]/(dashboard)/admin/appointments/page');
    const therapistAppointmentsPage = await import('@/app/[locale]/(dashboard)/therapist/appointments/page');
    const therapistSessionsPage = await import('@/app/[locale]/(dashboard)/therapist/sessions/page');
    const therapistSessionIdPage = await import('@/app/[locale]/(dashboard)/therapist/sessions/[id]/page');

    expect(typeof adminClientsPage.default).toBe('function');
    expect(typeof adminAppointmentsPage.default).toBe('function');
    expect(typeof therapistAppointmentsPage.default).toBe('function');
    expect(typeof therapistSessionsPage.default).toBe('function');
    expect(typeof therapistSessionIdPage.default).toBe('function');
  });
});
