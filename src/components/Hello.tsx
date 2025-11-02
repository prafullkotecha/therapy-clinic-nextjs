import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';

export const Hello = async () => {
  const t = await getTranslations('Dashboard');
  const session = await auth();

  return (
    <div>
      <p className="text-lg">
        {`👋 `}
        {t('hello_message', { email: session?.user?.email ?? '' })}
      </p>
    </div>
  );
};
