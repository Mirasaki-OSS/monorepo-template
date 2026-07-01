import { HTTPErrorAlert } from '@md-oss/design-system/components/state/http-error-alert';
import { headers } from 'next/headers';
import { getSession } from '@/actions/get-session';
import { transformToClientAuthContext } from '@/lib/client/auth-context';
import { requireAccessArea } from '@/lib/server/access-control';
import { serverTrpc } from '@/lib/server/trpc';
import AdminUsersPageClient from './client';

export default async function AdminUsersPage() {
  const [session, requestHeaders] = await Promise.all([
    getSession(),
    headers(),
  ]);

  if (!session.ok) {
    return <HTTPErrorAlert error={session.error} />;
  }

  requireAccessArea(session.data, 'admin.dashboard');
  requireAccessArea(session.data, 'admin.users.read');
  requireAccessArea(session.data, 'admin.users.manage');

  const trpc = await serverTrpc(requestHeaders);
  const definitions = await trpc.users.listDefinitions.query();

  return (
    <AdminUsersPageClient
      auth={transformToClientAuthContext(session.data)}
      definitions={definitions}
    />
  );
}
