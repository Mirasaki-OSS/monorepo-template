import { AmbientBlobField } from '@md-oss/design-system/components/animated/ambient-blob';
import { WithPageContainer } from '@md-oss/design-system/components/sections/page-container';

export default function Layout({ children }: LayoutProps<'/dashboard'>) {
  const ChildrenWithContainer = WithPageContainer(() => <>{children}</>);
  return (
    <>
      <ChildrenWithContainer />
      <AmbientBlobField />
    </>
  );
}
