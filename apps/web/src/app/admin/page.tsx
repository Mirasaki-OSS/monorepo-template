import { HTTPErrorAlert } from '@md-oss/design-system/components/state/http-error-alert';
import { forbidden, unauthorized } from 'next/navigation';
import { getSession } from '@/actions/get-session';
import AdminPageClient from './client';

export default async function AdminPage() {
  const session = await getSession();

  if (!session.ok) {
    return <HTTPErrorAlert error={session.error} />;
  }

  if (!session.data) {
    unauthorized();
  }

  if (!session.data.actor.roles.includes('admin')) {
    forbidden();
  }

  return <AdminPageClient />;
}
