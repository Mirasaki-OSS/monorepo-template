import { AmbientBlobField } from '@md-oss/design-system/components/animated/ambient-blob';
import { DevUtilities } from '@md-oss/design-system/components/dev-utilities';
import { WithPageContainer } from '@md-oss/design-system/components/sections/page-container';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from 'fumadocs-ui/layouts/home/navbar';
import { BookIcon } from 'lucide-react';
import { baseOptions } from '@/lib/layout.shared';

export default function Layout({ children }: LayoutProps<'/'>) {
  const ChildrenWithContainer = WithPageContainer(() => <>{children}</>);
  return (
    <HomeLayout
      {...baseOptions()}
      links={[
        {
          icon: <BookIcon />,
          text: 'Blog',
          url: '/blog',
          on: 'all',
          type: 'main',
          active: 'nested-url',
        },
        {
          type: 'menu',
          text: 'Guide',
          items: [
            {
              text: 'Getting Started',
              description: 'Learn to use Fumadocs',
              url: '/docs',
            },
          ],
        },
        {
          type: 'custom',
          // only displayed on navbar, not mobile menu
          on: 'nav',
          children: (
            <NavbarMenu>
              <NavbarMenuTrigger>Documentation</NavbarMenuTrigger>
              <NavbarMenuContent>
                <NavbarMenuLink href="/docs">Hello World</NavbarMenuLink>
              </NavbarMenuContent>
            </NavbarMenu>
          ),
        },
      ]}
    >
      <ChildrenWithContainer />
      <DevUtilities enabled={process.env.NODE_ENV !== 'production'} />
      <AmbientBlobField />
    </HomeLayout>
  );
}
