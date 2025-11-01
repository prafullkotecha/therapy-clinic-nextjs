import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';

type IUserProfilePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: IUserProfilePageProps): Promise<Metadata> {
  const { locale } = await props.params;
  const t = await getTranslations({
    locale,
    namespace: 'UserProfile',
  });

  return {
    title: t('meta_title'),
  };
}

export default async function UserProfilePage(props: IUserProfilePageProps) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const session = await auth();

  const keycloakAccountUrl = `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/account`;

  return (
    <div className="my-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="mb-4 text-2xl font-bold">User Profile</h1>

        <div className="mb-6 space-y-3">
          <div>
            <span className="font-semibold">Name:</span>
            {' '}
            {session?.user?.name ?? 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Email:</span>
            {' '}
            {session?.user?.email ?? 'N/A'}
          </div>
          <div>
            <span className="font-semibold">Roles:</span>
            {' '}
            {session?.user?.roles?.join(', ') ?? 'N/A'}
          </div>
        </div>

        <div className="border-t pt-4">
          <p className="mb-3 text-sm text-gray-600">
            To manage your profile, password, and security settings, visit the Keycloak Account Console:
          </p>
          <a
            href={keycloakAccountUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Manage Account in Keycloak
          </a>
        </div>
      </div>
    </div>
  );
};
