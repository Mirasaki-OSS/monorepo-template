import { DocsLayout } from 'fumadocs-ui/layouts/notebook';
import { HomeIcon, SettingsIcon } from 'lucide-react';
import { baseOptions } from '@/lib/layout.shared';
import { source } from '@/lib/source';

const vendorPackagesIconMap = {
  'vendor/common': <SettingsIcon />,
};

export default function Layout({ children }: LayoutProps<'/docs'>) {
  const { nav, ...base } = baseOptions();
  return (
    <DocsLayout
      tree={source.getPageTree()}
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
      sidebar={{
        banner: <div>Hello World</div>,
      }}
      tabMode="navbar"
      tabs={{
        transform: (option, node) => {
          console.log('Transforming tab option', option, node);
          return {
            ...option,
            icon: node.$id
              ? vendorPackagesIconMap[
                  node.$id as keyof typeof vendorPackagesIconMap
                ] || option.icon
              : option.icon,
          };
        },
      }}
    >
      {children}
    </DocsLayout>
  );
}
