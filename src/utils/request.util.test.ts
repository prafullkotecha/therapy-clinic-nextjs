/**
 * Unit tests for Request Utilities
 */

import { describe, expect, it } from 'vitest';
import { getClientIp, getRequestInfo, getUserAgent } from './request.util';

describe('Request Utils', () => {
  describe('getClientIp', () => {
    it('should extract IP from x-real-ip header', () => {
      const mockRequest = {
        headers: new Headers({
          'x-real-ip': '192.168.1.100',
          'x-forwarded-for': '10.0.0.1, 10.0.0.2',
        }),
      } as Request;

      const ip = getClientIp(mockRequest);

      expect(ip).toBe('192.168.1.100');
    });

    it('should extract IP from x-forwarded-for header when x-real-ip is missing', () => {
      const mockRequest = {
        headers: new Headers({
          'x-forwarded-for': '192.168.1.200, 10.0.0.1',
        }),
      } as Request;

      const ip = getClientIp(mockRequest);

      expect(ip).toBe('192.168.1.200');
    });

    it('should handle x-forwarded-for with single IP', () => {
      const mockRequest = {
        headers: new Headers({
          'x-forwarded-for': '192.168.1.300',
        }),
      } as Request;

      const ip = getClientIp(mockRequest);

      expect(ip).toBe('192.168.1.300');
    });

    it('should return "unknown" when no IP headers present', () => {
      const mockRequest = {
        headers: new Headers(),
      } as Request;

      const ip = getClientIp(mockRequest);

      expect(ip).toBe('unknown');
    });

    it('should trim whitespace from forwarded IPs', () => {
      const mockRequest = {
        headers: new Headers({
          'x-forwarded-for': '  192.168.1.400  ,  10.0.0.1  ',
        }),
      } as Request;

      const ip = getClientIp(mockRequest);

      expect(ip).toBe('192.168.1.400');
    });
  });

  describe('getUserAgent', () => {
    it('should extract user agent from header', () => {
      const mockUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) Chrome/91.0';
      const mockRequest = {
        headers: new Headers({
          'user-agent': mockUserAgent,
        }),
      } as Request;

      const userAgent = getUserAgent(mockRequest);

      expect(userAgent).toBe(mockUserAgent);
    });

    it('should return "unknown" when user agent header is missing', () => {
      const mockRequest = {
        headers: new Headers(),
      } as Request;

      const userAgent = getUserAgent(mockRequest);

      expect(userAgent).toBe('unknown');
    });
  });

  describe('getRequestInfo', () => {
    it('should extract both IP and user agent', () => {
      const mockUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      const mockRequest = {
        headers: new Headers({
          'x-real-ip': '192.168.1.500',
          'user-agent': mockUserAgent,
        }),
      } as Request;

      const info = getRequestInfo(mockRequest);

      expect(info).toEqual({
        ipAddress: '192.168.1.500',
        userAgent: mockUserAgent,
      });
    });

    it('should return "unknown" for both when headers missing', () => {
      const mockRequest = {
        headers: new Headers(),
      } as Request;

      const info = getRequestInfo(mockRequest);

      expect(info).toEqual({
        ipAddress: 'unknown',
        userAgent: 'unknown',
      });
    });
  });
});
