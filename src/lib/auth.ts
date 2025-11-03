import { eq } from 'drizzle-orm';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Keycloak from 'next-auth/providers/keycloak';
import { getAuthRequestContext } from '@/lib/auth-context';
import { DEV_BYPASS_TOKEN } from '@/lib/constants';
import { db } from '@/libs/DB';
import { Env } from '@/libs/Env';
import { users } from '@/models/user.schema';
import { logLoginSuccess } from '@/services/audit.service';
import { clearFailedAttempts, isAccountLocked } from '@/services/lockout.service';

// Development auth bypass - only enabled when DEV_BYPASS_AUTH=true and NODE_ENV=development
const isDevBypassEnabled = Env.DEV_BYPASS_AUTH === 'true' && Env.NODE_ENV === 'development';

// Production safety check
if (Env.DEV_BYPASS_AUTH === 'true' && Env.NODE_ENV === 'production') {
  throw new Error(
    'SECURITY ERROR: DEV_BYPASS_AUTH cannot be enabled in production! '
    + 'This would bypass all authentication and allow unauthorized access.',
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true, // Required for localhost in development
  providers: [
    // Development bypass provider - fetch real user from database by email
    ...(isDevBypassEnabled
      ? [
          Credentials({
            id: 'dev-bypass',
            name: 'Development Bypass',
            credentials: {
              email: { label: 'Email', type: 'text' },
            },
            async authorize(credentials) {
              if (!credentials?.email) {
                return null;
              }

              // Fetch user from database
              const [dbUser] = await db
                .select()
                .from(users)
                .where(eq(users.email, credentials.email as string))
                .limit(1);

              if (!dbUser || !dbUser.isActive) {
                return null;
              }

              // Return user object that will be used in JWT/session
              return {
                id: dbUser.id,
                email: dbUser.email,
                name: `${dbUser.firstName} ${dbUser.lastName}`,
                roles: [dbUser.role],
                tenantId: dbUser.tenantId,
              };
            },
          }),
        ]
      : []),
    // Keycloak provider (disabled in dev when bypass is enabled)
    ...((!isDevBypassEnabled)
      ? [
          Keycloak({
            clientId: process.env.KEYCLOAK_CLIENT_ID!,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
            issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Check account lockout and log successful login
      try {
        // Dev bypass provider
        if (account?.provider === 'dev-bypass') {
          // User is already fetched and validated in authorize()
          // Access tenantId and email from user object (no need to re-fetch)
          const tenantId = user.tenantId as string;
          const userEmail = user.email as string;
          const userId = user.id as string;

          // Check if account is locked (mirrors Keycloak behavior)
          const locked = await isAccountLocked(tenantId, userEmail, 'email');
          if (locked) {
            // Prevent login for locked accounts
            return false;
          }

          // Update last login timestamp
          await db
            .update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.id, userId));

          // Clear any failed login attempts on successful login
          await clearFailedAttempts(tenantId, userEmail);

          return true;
        }

        // Keycloak provider
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
    async jwt({ token, account, profile, user }) {
      // Persist additional user info in the JWT
      if (account) {
        // Dev bypass provider
        if (account.provider === 'dev-bypass' && user) {
          token.sub = user.id; // Set user ID in token.sub for NextAuth v5
          token.accessToken = DEV_BYPASS_TOKEN;
          token.idToken = DEV_BYPASS_TOKEN;
          token.roles = user.roles || [];
          token.tenantId = user.tenantId as string;
        } else if (profile) {
          // Keycloak provider
          token.accessToken = account.access_token;
          token.idToken = account.id_token;
          token.roles = (profile as any).realm_access?.roles || [];
          token.tenantId = (profile as any).tenant_id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Make roles and tenant available on the session
      // Note: Spreading session.user after setting id would overwrite it,
      // so we explicitly build the user object with all properties
      const updatedSession = {
        ...session,
        user: {
          ...session.user, // Spread existing user props first
          id: (token.sub as string) || session.user.id || '', // Then set/override ID from token.sub
          roles: (token.roles as string[]) || [],
          tenantId: (token.tenantId as string) || '',
        },
        accessToken: (token.accessToken as string) || '',
        idToken: (token.idToken as string) || '',
      };

      return updatedSession;
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
