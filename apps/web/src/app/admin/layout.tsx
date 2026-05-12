import { AmbientBlobField } from '@md-oss/design-system/components/animated/ambient-blob';
import { WithPageContainer } from '@md-oss/design-system/components/sections/page-container';
import { AdminHeader } from './components/headers';

// [DEV] https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes

export default function Layout({ children }: LayoutProps<'/dashboard'>) {
  const ChildrenWithContainer = WithPageContainer(() => <>{children}</>);
  return (
    <>
      <AdminHeader />
      <ChildrenWithContainer />
      <AmbientBlobField />
    </>
  );
}
