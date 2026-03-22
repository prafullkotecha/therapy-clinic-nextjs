export function getEnabledAuthProviders(rawProviders: string | undefined): string[] {
  return (rawProviders ?? 'keycloak')
    .split(',')
    .map(provider => provider.trim().toLowerCase())
    .filter(Boolean);
}
