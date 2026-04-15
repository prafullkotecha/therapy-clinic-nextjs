import type { Metadata } from 'next';
import { AuthError } from 'next-auth';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { auth, signIn } from '@/lib/auth';
import { getAuthProviderConfig } from '@/lib/auth-providers';

const {
  isDevBypassEnabled,
  useCredentialsProvider,
  useKeycloakProvider,
} = getAuthProviderConfig({
  authProviders: process.env.AUTH_PROVIDERS,
  devBypassAuth: process.env.DEV_BYPASS_AUTH,
  nodeEnv: process.env.NODE_ENV,
});

type ISignInPageProps = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ error?: string }>;
};

export async function generateMetadata(props: ISignInPageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'SignIn',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

export default async function SignInPage(props: ISignInPageProps) {
  const { locale } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const loginErrorCode = searchParams?.error;
  const loginError = loginErrorCode === 'invalid_credentials' ? 'Invalid credentials' : null;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'SignIn',
  });

  // Check if user is already authenticated
  const session = await auth();
  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardBody>
          {/* Logo */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary-600">
              Therapy Clinic System
            </h1>
            <p className="mt-2 text-gray-600">
              {t('subtitle')}
            </p>
          </div>

          {/* Sign-in form */}
          <div className="space-y-4">
            {useCredentialsProvider && (
              <form
                className="space-y-3"
                action={async (formData) => {
                  'use server';
                  const email = String(formData.get('email') ?? '').trim().toLowerCase();
                  const password = String(formData.get('password') ?? '');

                  if (!email || !password) {
                    return;
                  }

                  try {
                    await signIn('credentials', {
                      email,
                      password,
                      redirectTo: `/${locale}/dashboard`,
                    });
                  } catch (error) {
                    if (error instanceof AuthError) {
                      redirect(`/${locale}/sign-in?error=invalid_credentials`);
                    }
                    throw error;
                  }
                }}
              >
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    minLength={12}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum 12 characters.</p>
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                >
                  Sign in with email
                </Button>
              </form>
            )}

            {useKeycloakProvider && (
              <form
                action={async () => {
                  'use server';
                  await signIn('keycloak');
                }}
              >
                <Button
                  type="submit"
                  variant={useCredentialsProvider ? 'secondary' : 'primary'}
                  size="lg"
                  fullWidth
                >
                  {useCredentialsProvider ? 'Sign in with Keycloak' : t('sign_in_button')}
                </Button>
              </form>
            )}

            {isDevBypassEnabled && (
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                Development bypass is enabled. You can also use the seeded login helper at
                {' '}
                <code>/dev-login</code>
                .
              </div>
            )}
          </div>

          {loginError && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
              {loginError}
            </div>
          )}

          {/* Security notice */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              🔒
              {' '}
              {t('security_notice')}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
