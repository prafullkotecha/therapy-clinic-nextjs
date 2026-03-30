import { describe, expect, it } from 'vitest';
import {
  isPasswordPolicyCompliant,
  validatePasswordComplexity,
  verifyCsrfToken,
} from '@/lib/password-policy';

describe('password-policy', () => {
  describe('validatePasswordComplexity', () => {
    it('accepts password meeting all complexity requirements', () => {
      const result = validatePasswordComplexity('StrongerPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('rejects passwords missing each complexity dimension', () => {
      const result = validatePasswordComplexity('weakpass');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('rejects too-short passwords even if diverse characters exist', () => {
      const result = validatePasswordComplexity('Aa1!short');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 12 characters long');
    });
  });

  describe('isPasswordPolicyCompliant', () => {
    it('returns true for compliant password', () => {
      expect(isPasswordPolicyCompliant('Comp!exPass123')).toBe(true);
    });

    it('returns false when missing special character', () => {
      expect(isPasswordPolicyCompliant('ComplexPass1234')).toBe(false);
    });

    it('returns false when missing uppercase', () => {
      expect(isPasswordPolicyCompliant('complexpass123!')).toBe(false);
    });
  });

  describe('verifyCsrfToken', () => {
    it('returns true for matching token pair', () => {
      expect(verifyCsrfToken('abc', 'abc')).toBe(true);
    });

    it('returns false for mismatched token pair', () => {
      expect(verifyCsrfToken('abc', 'def')).toBe(false);
    });

    it('returns false when either token is missing', () => {
      expect(verifyCsrfToken(undefined, 'abc')).toBe(false);
      expect(verifyCsrfToken('abc', undefined)).toBe(false);
    });
  });
});
