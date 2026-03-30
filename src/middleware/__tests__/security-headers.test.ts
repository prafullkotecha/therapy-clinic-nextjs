import { describe, expect, it } from 'vitest';
import { securityHeaders } from '@/middleware/security-headers';

describe('securityHeaders', () => {
  it('includes required HIPAA transport and framing headers', () => {
    expect(securityHeaders['Strict-Transport-Security']).toContain('max-age=31536000');
    expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff');
    expect(securityHeaders['X-Frame-Options']).toBe('DENY');
  });

  it('includes CSP and privacy related headers', () => {
    expect(securityHeaders['Content-Security-Policy']).toContain("default-src 'self'");
    expect(securityHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(securityHeaders['Permissions-Policy']).toContain('camera=()');
  });

  it('exports string-only header values for next config compatibility', () => {
    Object.values(securityHeaders).forEach((value) => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });
});
