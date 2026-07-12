import type { MetadataRoute } from 'next';
import { clientEnv } from '@/lib/client/env';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: clientEnv.NEXT_PUBLIC_APP_NAME,
    short_name: clientEnv.NEXT_PUBLIC_APP_NAME_SHORT,
    description: clientEnv.NEXT_PUBLIC_APP_DESCRIPTION,
    start_url: '/',
    display: 'standalone',
    background_color: '#202020',
    theme_color: '#007595',
    categories: ['technology', 'education'],
    dir: 'ltr',
    lang: 'en-US',
    shortcuts: [
      {
        name: 'Documentation',
        short_name: 'Docs',
        description: 'Read the documentation',
        url: '/docs',
      },
      {
        name: 'Blog',
        short_name: 'Blog',
        description: 'Read the latest news and updates',
        url: '/blog',
      },
    ],
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/apple-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
