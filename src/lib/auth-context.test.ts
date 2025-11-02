/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from 'vitest';
import { getAuthRequestContext } from './auth-context';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

describe('auth-context', () => {
  describe('getAuthRequestContext', () => {
    it('should return IP and user agent from cookies', async () => {
      const { cookies } = await import('next/headers');

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn((name: string) => {
          if (name === '__auth_ip') {
            return { value: '192.168.1.1' };
          }
          if (name === '__auth_ua') {
            return { value: 'Mozilla/5.0' };
          }
          return undefined;
        }),
      } as any);

      const context = await getAuthRequestContext();

      expect(context.ipAddress).toBe('192.168.1.1');
      expect(context.userAgent).toBe('Mozilla/5.0');
    });

    it('should return "unavailable" when cookies are missing', async () => {
      const { cookies } = await import('next/headers');

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => undefined),
      } as any);

      const context = await getAuthRequestContext();

      expect(context.ipAddress).toBe('unavailable');
      expect(context.userAgent).toBe('unavailable');
    });

    it('should handle partial cookie presence', async () => {
      const { cookies } = await import('next/headers');

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn((name: string) => {
          if (name === '__auth_ip') {
            return { value: '10.0.0.1' };
          }
          return undefined;
        }),
      } as any);

      const context = await getAuthRequestContext();

      expect(context.ipAddress).toBe('10.0.0.1');
      expect(context.userAgent).toBe('unavailable');
    });
  });
});
