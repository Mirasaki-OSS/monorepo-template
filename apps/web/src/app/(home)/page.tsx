import { WithPageContainer } from '@md-oss/design-system/components/sections/page-container';
import { HTTPErrorAlert } from '@md-oss/design-system/components/state/http-error-alert';
import { getSession } from '@/actions/get-session';
import HomePageClient from './client';

export default async function HomePage() {
  const session = await getSession();

  console.dir(
    {
      source: 'HomePage Server Component',
      ...session,
    },
    { depth: null }
  );

  if (!session.ok) {
    return <HTTPErrorAlert error={session.error} />;
  }

  return WithPageContainer(HomePageClient)({});
}
