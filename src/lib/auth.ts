import { eq } from 'drizzle-orm';
import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import { getAuthRequestContext } from '@/lib/auth-context';
import { db } from '@/libs/DB';
import { users } from '@/models/user.schema';
import { logLoginSuccess } from '@/services/audit.service';
import { clearFailedAttempts, isAccountLocked } from '@/services/lockout.service';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check account lockout and log successful login
      try {
        if (account && profile) {
          const tenantId = (profile as any).tenant_id as string | undefined;
          const keycloakId = user.id;

          if (tenantId && keycloakId) {
            // Find user in our database
            const [dbUser] = await db
              .select()
              .from(users)
              .where(eq(users.keycloakId, keycloakId))
              .limit(1);

            if (dbUser) {
              // Check if account is locked
              const locked = await isAccountLocked(tenantId, dbUser.email, 'email');
              if (locked) {
                // Prevent login for locked accounts
                return false;
              }

              // Update last login timestamp
              await db
                .update(users)
                .set({ lastLoginAt: new Date() })
                .where(eq(users.id, dbUser.id));

              // Clear any failed login attempts on successful login
              await clearFailedAttempts(tenantId, dbUser.email);

              // Get request context from middleware cookies
              const { ipAddress, userAgent } = await getAuthRequestContext();

              // Log the login event with real IP and user agent
              await logLoginSuccess(
                tenantId,
                dbUser.id,
                ipAddress,
                userAgent,
              );
            }
          }
        }
      } catch (error) {
        // Log error but don't prevent login
        console.error('Failed to log auth event:', error);
      }

      return true;
    },
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
  events: {
    async signOut(message) {
      // Log logout event
      try {
        // NextAuth v5 signOut event provides either session or token
        const token = 'token' in message ? message.token : null;

        if (!token) {
          return;
        }

        const tenantId = token?.tenantId as string | undefined;
        const keycloakId = token?.sub as string | undefined;

        if (tenantId && keycloakId) {
          // Find user in our database
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.keycloakId, keycloakId))
            .limit(1);

          if (dbUser) {
            const { logLogout } = await import('@/services/audit.service');

            // Get request context from middleware cookies
            const { ipAddress, userAgent } = await getAuthRequestContext();

            // Log logout event with real IP and user agent
            await logLogout(
              tenantId,
              dbUser.id,
              ipAddress,
              userAgent,
            );
          }
        }
      } catch (error) {
        // Log error but don't prevent logout
        console.error('Failed to log logout event:', error);
      }
    },
  },
});
