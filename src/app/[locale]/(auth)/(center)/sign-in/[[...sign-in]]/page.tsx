import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
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

  // Check if user is already authenticated
  const session = await auth();
  if (session?.user) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign In</h2>
          <p className="mt-2 text-gray-600">
            Access the Therapy Clinic System
          </p>
        </div>

        <form
          action={async () => {
            'use server';
            await signIn('keycloak');
          }}
          className="mt-8"
        >
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            Sign in with Keycloak
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          HIPAA-compliant authentication via Keycloak
        </p>
      </div>
    </div>
  );
};
