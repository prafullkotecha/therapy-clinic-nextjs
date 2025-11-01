import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist additional user info in the JWT
      if (account && profile) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.roles = (profile as any).realm_access?.roles || [];
        token.tenantId = (profile as any).tenant_id;
      }
      return token;
    },
    async session({ session, token }) {
      // Make roles and tenant available on the session
      return {
        ...session,
        user: {
          ...session.user,
          roles: (token.roles as string[]) || [],
          tenantId: (token.tenantId as string) || '',
        },
        accessToken: (token.accessToken as string) || '',
        idToken: (token.idToken as string) || '',
      };
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 15 * 60, // 15 minutes (HIPAA compliance)
  },
});
