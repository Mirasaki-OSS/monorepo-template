import { AmbientBlobField } from '@md-oss/design-system/components/animated/ambient-blob';
import { AdminSidebarLayout } from './components/admin-sidebar-layout';

export default function Layout({ children }: LayoutProps<'/dashboard'>) {
  return (
    <>
      <AdminSidebarLayout>{children}</AdminSidebarLayout>
      <AmbientBlobField />
    </>
  );
}
