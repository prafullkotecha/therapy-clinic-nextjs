import { describe, expect, it } from 'vitest';
import { getSignOutLookupStrategy } from './auth-audit';

describe('auth-audit', () => {
  it('uses id lookup for credentials provider sessions', () => {
    expect(getSignOutLookupStrategy({
      authProvider: 'credentials',
      accessToken: 'any-token',
      nodeEnv: 'production',
    })).toBe('id');
  });

  it('uses keycloakId lookup for keycloak provider sessions', () => {
    expect(getSignOutLookupStrategy({
      authProvider: 'keycloak',
      accessToken: 'oauth-token',
      nodeEnv: 'production',
    })).toBe('keycloakId');
  });

  it('skips legacy dev-bypass tokens in production', () => {
    expect(getSignOutLookupStrategy({
      accessToken: 'dev-bypass-token',
      nodeEnv: 'production',
    })).toBe('skip');
  });

  it('keeps legacy dev-bypass tokens working in development', () => {
    expect(getSignOutLookupStrategy({
      accessToken: 'dev-bypass-token',
      nodeEnv: 'development',
    })).toBe('id');
  });

  it('defaults legacy non-dev tokens to keycloakId lookup', () => {
    expect(getSignOutLookupStrategy({
      accessToken: 'legacy-oauth-token',
      nodeEnv: 'production',
    })).toBe('keycloakId');
  });
});
