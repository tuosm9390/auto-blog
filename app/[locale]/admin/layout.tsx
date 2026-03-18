import { PageContainer } from '@/components/ui/PageContainer';
import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Admin.Menu');
  return (
    <PageContainer>
      <div className='flex gap-8'>
        <aside className='w-48 space-y-4 border-r pr-4'>
          <h2 className='font-bold text-lg'>Admin Menu</h2>
          <nav className='flex flex-col gap-2'>
            <Link href='/admin/testers' className='p-2 hover:bg-gray-100 rounded'>{t('Testers')}</Link>
            <Link href='/admin/users' className='p-2 hover:bg-gray-100 rounded'>{t('Users')}</Link>
            <Link href='/admin/subscriptions' className='p-2 hover:bg-gray-100 rounded'>{t('Subscriptions')}</Link>
          </nav>
        </aside>
        <main className='flex-1'>{children}</main>
      </div>
    </PageContainer>
  );
}