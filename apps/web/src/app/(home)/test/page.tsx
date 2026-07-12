import { HTTPErrorAlert } from '@md-oss/design-system/components/state/http-error-alert';
import { unauthorized } from 'next/navigation';
import { getSession } from '@/actions/get-session';
import TestPageClient from './client';

export default async function TestPage() {
  const session = await getSession();

  if (!session.ok) {
    return <HTTPErrorAlert error={session.error} />;
  }

  if (!session.data) {
    unauthorized();
  }

  return <TestPageClient />;
}
