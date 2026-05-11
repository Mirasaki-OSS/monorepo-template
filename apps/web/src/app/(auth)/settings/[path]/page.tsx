import { SettingsPage as SettingsPageComponent } from '@md-oss/design-system/components/auth/pages/settings-page';
import { notFound } from 'next/navigation';
import { getQueryClient } from '@/lib/query-client';
import { customExtendedViewPaths } from '@/lib/view-paths';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{
    path: string;
  }>;
}) {
  const { path } = await params;
  return (
    <SettingsPageComponent
      path={path}
      notFound={notFound}
      queryClient={getQueryClient()}
      viewPaths={customExtendedViewPaths}
    />
  );
}
