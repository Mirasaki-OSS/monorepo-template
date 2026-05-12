import { AmbientBlobField } from '@md-oss/design-system/components/animated/ambient-blob';
import { UserButton } from '@md-oss/design-system/components/auth/user/user-button';
import { WithPageContainer } from '@md-oss/design-system/components/sections/page-container';
import { InlineCode } from '@md-oss/design-system/components/ui/inline-code';
import { cn } from '@md-oss/design-system/lib/utils';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import {
  NavbarMenu,
  NavbarMenuContent,
  NavbarMenuLink,
  NavbarMenuTrigger,
} from 'fumadocs-ui/layouts/home/navbar';
import { BookIcon, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { baseOptions } from '@/lib/layout.shared';

type LayoutNavMenuItemProps = {
  className?: string;
  href: string;
  title: ReactNode;
  description: ReactNode;
  Icon?: LucideIcon;
};

const LayoutNavMenuItem = ({
  href,
  title,
  description,
  ...props
}: LayoutNavMenuItemProps) => {
  return (
    <NavbarMenuLink href={href} className={cn(props.className)}>
      <span className="flex items-center gap-1.5">
        <span className="p-1 bg-gray-50 dark:bg-gray-800 border rounded w-min shrink-0 h-full inline-flex items-center">
          {props.Icon && <props.Icon className="shrink-0" size={16} />}
        </span>
        <span>{title}</span>
      </span>
      <span className="text-muted-foreground text-sm">{description}</span>
    </NavbarMenuLink>
  );
};

export default function Layout({ children }: LayoutProps<'/'>) {
  const ChildrenWithContainer = WithPageContainer(() => <>{children}</>);
  return (
    <HomeLayout
      {...baseOptions()}
      githubUrl={undefined}
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
          type: 'custom',
          on: 'nav', // only displayed on navbar, not mobile menu
          children: (
            <NavbarMenu>
              <NavbarMenuTrigger asChild>
                <Link href="/docs/guides/getting-started">Docs</Link>
              </NavbarMenuTrigger>
              <NavbarMenuContent>
                <LayoutNavMenuItem
                  href="/docs/guides/getting-started"
                  title="Getting Started"
                  description={
                    <>
                      Learn how to get started on your own project using{' '}
                      <InlineCode className="whitespace-nowrap">
                        @md-oss/monorepo-template
                      </InlineCode>
                      .
                    </>
                  }
                  Icon={BookIcon}
                />
              </NavbarMenuContent>
            </NavbarMenu>
          ),
        },
        {
          type: 'custom',
          children: <UserButton size="icon" />,
          secondary: true,
          on: 'all',
        },
      ]}
    >
      <ChildrenWithContainer />
      <AmbientBlobField />
    </HomeLayout>
  );
}
