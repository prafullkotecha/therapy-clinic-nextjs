import type { DefaultSession } from 'next-auth';

// TypeScript module augmentation MUST use 'interface' not 'type'
// for declaration merging to work correctly
declare module 'next-auth' {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface Session {
    user: {
      roles: string[];
      tenantId: string;
    } & DefaultSession['user'];
    accessToken: string;
    idToken: string;
  }

  // Note: User augmentation has known issues in callbacks with next-auth v5
  // Use type assertions in callbacks if needed
  // eslint-disable-next-line ts/consistent-type-definitions
  interface User {
    roles?: string[];
    tenantId?: string;
  }
}

declare module 'next-auth/jwt' {
  // eslint-disable-next-line ts/consistent-type-definitions
  interface JWT {
    roles?: string[];
    tenantId?: string;
    accessToken?: string;
    idToken?: string;
  }
}
