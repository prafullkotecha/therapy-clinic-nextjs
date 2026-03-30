import { describe, expect, it } from 'vitest';
import { getAuthProviderConfig, getEnabledAuthProviders } from './auth-providers';

describe('auth-providers', () => {
  it('parses enabled providers list', () => {
    expect(getEnabledAuthProviders('keycloak, credentials')).toEqual(['keycloak', 'credentials']);
  });

  it('enables credentials provider when explicitly configured', () => {
    const config = getAuthProviderConfig({
      authProviders: 'credentials',
      devBypassAuth: 'false',
      nodeEnv: 'production',
    });

    expect(config.useCredentialsProvider).toBe(true);
    expect(config.useKeycloakProvider).toBe(false);
  });

  it('disables keycloak when dev bypass is enabled', () => {
    const config = getAuthProviderConfig({
      authProviders: 'keycloak,credentials',
      devBypassAuth: 'true',
      nodeEnv: 'development',
    });

    expect(config.isDevBypassEnabled).toBe(true);
    expect(config.useCredentialsProvider).toBe(true);
    expect(config.useKeycloakProvider).toBe(false);
  });

  it('throws when dev bypass is enabled in production', () => {
    expect(() =>
      getAuthProviderConfig({
        authProviders: 'keycloak,credentials',
        devBypassAuth: 'true',
        nodeEnv: 'production',
      }),
    ).toThrowError(/DEV_BYPASS_AUTH cannot be enabled in production/);
  });
});
