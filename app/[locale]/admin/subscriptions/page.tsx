import { getAllProfiles } from '@/lib/profiles';
import { Card } from '@/components/ui/Card';
import { getTranslations } from 'next-intl/server';

export default async function SubscriptionsPage() {
  const users = await getAllProfiles();
  const t = await getTranslations('Admin.Subscription');

  return (
    <Card className='p-6'>
      <h1 className='text-2xl font-bold mb-4'>{t('Title')}</h1>
      <table className='w-full text-left'>
        <thead>
          <tr className='border-b'>
            <th className='p-2'>{t('Username')}</th>
            <th className='p-2'>{t('Tier')}</th>
            <th className='p-2'>{t('Status')}</th>
            <th className='p-2'>{t('Usage')}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className='border-b'>
              <td className='p-2'>{user.username}</td>
              <td className='p-2'>{user.subscription_tier}</td>
              <td className='p-2'>{user.subscription_status}</td>
              <td className='p-2'>{user.usage_count_month}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}