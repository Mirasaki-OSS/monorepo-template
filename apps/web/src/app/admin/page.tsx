import { HTTPErrorAlert } from '@md-oss/design-system/components/state/http-error-alert';
import { headers } from 'next/headers';
import { getSession } from '@/actions/get-session';
import { transformToClientAuthContext } from '@/lib/client/auth-context';
import { requireAccessArea } from '@/lib/server/access-control';
import { serverTrpc } from '@/lib/server/trpc';
import AdminPageClient from './client';

export default async function AdminPage() {
  const [session, requestHeaders] = await Promise.all([
    getSession(),
    headers(),
  ]);

  if (!session.ok) {
    return <HTTPErrorAlert error={session.error} />;
  }

  requireAccessArea(session.data, 'admin.dashboard');

  const trpc = await serverTrpc(requestHeaders);
  const [totalUsers] = await Promise.all([trpc.users.count.query()]);

  return (
    <AdminPageClient
      auth={transformToClientAuthContext(session.data)}
      totals={{
        users: totalUsers.count,
      }}
    />
  );
}
