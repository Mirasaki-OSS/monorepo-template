import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { HomeIcon } from 'lucide-react';
import { baseOptions } from '@/lib/layout.shared';
import { getMergedPageTree } from '@/lib/source';

import 'katex/dist/katex.css';
import 'remark-github-blockquote-alert/alert.css';

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
          icon: <HomeIcon />,
          text: 'Home',
          label: 'Go to homepage', // aria-label
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
