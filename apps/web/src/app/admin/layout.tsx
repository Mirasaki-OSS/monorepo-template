import { AmbientBlobField } from '@md-oss/design-system/components/animated/ambient-blob';
import { AdminSidebarLayout } from './components/admin-sidebar-layout';

// [DEV] https://nextjs.org/docs/app/api-reference/file-conventions/parallel-routes

export default function Layout({ children }: LayoutProps<'/dashboard'>) {
  return (
    <>
      <AdminSidebarLayout>{children}</AdminSidebarLayout>
      <AmbientBlobField />
    </>
  );
}
