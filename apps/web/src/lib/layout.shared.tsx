import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { BookIcon } from 'lucide-react';
import { appName, gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      // JSX supported
      title: appName,
      transparentMode: 'top',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
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
