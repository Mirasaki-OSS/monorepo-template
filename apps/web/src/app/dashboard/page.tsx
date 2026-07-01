import { HTTPErrorAlert } from '@md-oss/design-system/components/state/http-error-alert';
import { getSession } from '@/actions/get-session';
import { requireAccessArea } from '@/lib/server/access-control';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session.ok) {
    return <HTTPErrorAlert error={session.error} />;
  }

  requireAccessArea(session.data, 'dashboard');

  return <div>Dashboard</div>;
}
