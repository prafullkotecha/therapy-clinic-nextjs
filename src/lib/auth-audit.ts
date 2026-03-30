import { DEV_BYPASS_TOKEN } from '@/lib/constants';

export type SignOutLookupStrategy = 'id' | 'keycloakId' | 'skip';

type GetSignOutLookupStrategyInput = {
  authProvider?: string;
  accessToken?: string;
  nodeEnv: string;
};

export function getSignOutLookupStrategy(input: GetSignOutLookupStrategyInput): SignOutLookupStrategy {
  const { authProvider, accessToken, nodeEnv } = input;

  if (authProvider === 'credentials') {
    if (accessToken === DEV_BYPASS_TOKEN && nodeEnv !== 'development') {
      return 'skip';
    }
    return 'id';
  }

  if (authProvider === 'keycloak') {
    return 'keycloakId';
  }

  // Legacy fallback for tokens issued before authProvider was persisted
  if (accessToken === DEV_BYPASS_TOKEN) {
    return nodeEnv === 'development' ? 'id' : 'skip';
  }

  console.warn('Missing authProvider on JWT during signOut; defaulting to keycloakId lookup.');
  return 'keycloakId';
}
