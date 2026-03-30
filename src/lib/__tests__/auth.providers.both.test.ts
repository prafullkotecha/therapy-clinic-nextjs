import { describe, expect, it } from 'vitest';
import { getAuthProviderConfig, getEnabledAuthProviders } from '@/lib/auth-providers';

describe('auth providers both mode', () => {
  it('treats AUTH_PROVIDERS=both as keycloak and credentials', () => {
    expect(getEnabledAuthProviders('both')).toEqual(['keycloak', 'credentials']);
  });

  it('enables both providers in production when configured as both', () => {
    const config = getAuthProviderConfig({
      authProviders: 'both',
      devBypassAuth: 'false',
      nodeEnv: 'production',
    });

    expect(config.useCredentialsProvider).toBe(true);
    expect(config.useKeycloakProvider).toBe(true);
  });

  it('keeps keycloak disabled when dev bypass is active', () => {
    const config = getAuthProviderConfig({
      authProviders: 'both',
      devBypassAuth: 'true',
      nodeEnv: 'development',
    });

    expect(config.useCredentialsProvider).toBe(true);
    expect(config.useKeycloakProvider).toBe(false);
  });
});
