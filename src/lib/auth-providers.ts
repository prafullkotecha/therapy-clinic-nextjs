export function getEnabledAuthProviders(rawProviders: string | undefined): string[] {
  const normalized = (rawProviders ?? 'keycloak').trim().toLowerCase();
  const providers = normalized === 'both' ? 'keycloak,credentials' : (rawProviders ?? 'keycloak');

  return providers
    .split(',')
    .map(provider => provider.trim().toLowerCase())
    .filter(Boolean);
}

export function getAuthProviderConfig(input: {
  authProviders: string | undefined;
  devBypassAuth: string | undefined;
  nodeEnv: string | undefined;
}): {
  isDevBypassEnabled: boolean;
  useCredentialsProvider: boolean;
  useKeycloakProvider: boolean;
} {
  if (input.devBypassAuth === 'true' && input.nodeEnv === 'production') {
    throw new Error(
      'SECURITY ERROR: DEV_BYPASS_AUTH cannot be enabled in production.',
    );
  }

  const enabledProviders = getEnabledAuthProviders(input.authProviders);
  const isDevBypassEnabled
    = input.devBypassAuth === 'true' && input.nodeEnv === 'development';

  return {
    isDevBypassEnabled,
    useCredentialsProvider: enabledProviders.includes('credentials') || isDevBypassEnabled,
    useKeycloakProvider: enabledProviders.includes('keycloak') && !isDevBypassEnabled,
  };
}
