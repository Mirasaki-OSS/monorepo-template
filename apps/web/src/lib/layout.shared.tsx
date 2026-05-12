import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookIcon } from 'lucide-react';
import { githubUrl } from './github';
import { appName } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
      transparentMode: 'top',
    },
    githubUrl: githubUrl(),
    links: [
      {
        icon: <BookIcon />,
        text: 'Docs',
        url: '/docs',
        secondary: false,
      },
    ],
  };
}
