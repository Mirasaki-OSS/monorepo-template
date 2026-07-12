import { HTTPErrorAlert } from '@md-oss/design-system/components/state/http-error-alert';
import { getSession } from '@/actions/get-session';
import HomePageClient from './client';

export default async function HomePage() {
  const session = await getSession();

  if (!session.ok) {
    return <HTTPErrorAlert error={session.error} />;
  }

  return <HomePageClient />;
}
