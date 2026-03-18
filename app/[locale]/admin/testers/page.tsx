import { requireAdminAuth } from '@/lib/api-utils';
import { getTranslations } from 'next-intl/server';
import TesterManagementClient from './TesterManagementClient';

export default async function AdminTestersPage() {
  await requireAdminAuth();
  const t = await getTranslations('Admin.Tester');

  return (
    <div className='max-w-6xl mx-auto px-4 py-12'>
      <div className='mb-10'>
        <h1 className='text-3xl font-display font-bold mb-2'>{t('Title')}</h1>
        <p className='text-text-secondary'>{t('Subtitle')}</p>
      </div>
      <TesterManagementClient />
    </div>
  );
}