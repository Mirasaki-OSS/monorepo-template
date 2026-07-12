import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { HomeIcon } from 'lucide-react';
import { baseOptions } from '@/lib/layout.shared';
import { getMergedPageTree } from '@/lib/source';

import 'katex/dist/katex.css';
import 'remark-github-blockquote-alert/alert.css';
import { Header } from '@/layouts/notebook/slots/header';

export default async function Layout({ children }: LayoutProps<'/docs'>) {
  'use server';
  const tree = await getMergedPageTree();
  const { nav, ...base } = baseOptions();
  return (
    <DocsLayout
      tree={tree}
      {...base}
      nav={{ ...nav }}
      slots={{
        header: Header,
      }}
      links={[
        {
          icon: <HomeIcon />,
          text: 'Home',
          label: 'Go to homepage',
          url: '/',
          on: 'all',
          type: 'icon',
          active: 'url',
        },
        // Note: Included in customized Header slot - Desktop Only
        // {
        //   type: 'custom',
        //   children: <UserButton size="icon" className="md:hidden" />,
        //   secondary: true,
        //   on: 'menu',
        // },
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
