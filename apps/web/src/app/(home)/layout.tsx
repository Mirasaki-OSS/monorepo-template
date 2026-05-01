import { AmbientBlobField } from '@md-oss/design-system/components/animated/ambient-blob';
import { DevUtilities } from '@md-oss/design-system/components/dev-utilities';
import { WithPageContainer } from '@md-oss/design-system/components/sections/page-container';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  const ChildrenWithContainer = WithPageContainer(() => <>{children}</>);
  return (
    <HomeLayout {...baseOptions()}>
      <ChildrenWithContainer />
      <DevUtilities enabled={process.env.NODE_ENV !== 'production'} />
      <AmbientBlobField />
    </HomeLayout>
  );
}
