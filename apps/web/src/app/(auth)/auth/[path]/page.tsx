import AuthPageComponent from '@md-oss/design-system/components/auth/pages/auth-page';
import { notFound } from 'next/navigation';

export default async function AuthPage({
  params,
}: {
  params: Promise<{
    path: string;
  }>;
}) {
  const { path } = await params;
  return (
    <AuthPageComponent
      path={path}
      notFound={notFound}
      slotProps={{
        auth: {
          socialLayout: 'horizontal',
          socialPosition: 'top',
        },
      }}
    />
  );
}
