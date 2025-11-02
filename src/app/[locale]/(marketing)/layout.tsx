import { getTranslations, setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

export default async function MarketingLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({
    locale,
    namespace: 'RootLayout',
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Simple header */}
      <header className="border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-primary-600">
                Therapy Clinic System
              </Link>
            </div>

            <nav className="flex items-center gap-6">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {t('sign_in_link')}
              </Link>
              <LocaleSwitcher />
            </nav>
          </div>
        </div>
      </header>

      <main>{props.children}</main>

      <footer className="border-t border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-600">
          ©
          {' '}
          {new Date().getFullYear()}
          {' '}
          Therapy Clinic System. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
