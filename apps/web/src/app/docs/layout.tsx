import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { HomeIcon } from 'lucide-react';
import { baseOptions } from '@/lib/layout.shared';
import { getMergedPageTree } from '@/lib/source';

import 'katex/dist/katex.css';
import 'remark-github-blockquote-alert/alert.css';
import { UserButton } from '@md-oss/design-system/components/auth/user/user-button';

export default async function Layout({ children }: LayoutProps<'/docs'>) {
  const tree = await getMergedPageTree();
  const { nav, ...base } = baseOptions();
  return (
    <DocsLayout
      tree={tree}
      {...base}
      nav={{ ...nav }}
      links={[
        {
          type: 'custom',
          children: <UserButton size="icon" />,
          secondary: true,
          on: 'all',
        },
        {
          icon: <HomeIcon />,
          text: 'Home',
          label: 'Go to homepage',
          url: '/',
          on: 'all',
          type: 'icon',
          active: 'url',
        },
      ]}
      // sidebar={{
      //   banner: <div key="custom-sidebar-banner">Hello World</div>,
      // }}
      tabMode="sidebar"
    >
      {children}
    </DocsLayout>
  );
}
