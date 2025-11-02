import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { auth, signIn } from '@/lib/auth';

type ISignInPageProps = {
  params: Promise<{ locale: string }>;
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
          <form
            action={async () => {
              'use server';
              await signIn('keycloak');
            }}
          >
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
            >
              {t('sign_in_button')}
            </Button>
          </form>

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
