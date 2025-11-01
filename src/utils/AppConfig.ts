import type { LocalePrefixMode } from 'next-intl/routing';

const localePrefix: LocalePrefixMode = 'as-needed';

export const AppConfig = {
  name: 'Therapy Clinic System',
  locales: ['en'],
  defaultLocale: 'en',
  localePrefix,
};
