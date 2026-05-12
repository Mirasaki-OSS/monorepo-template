import { RootProvider } from 'fumadocs-ui/provider/next';

import './global.css';
import { DevUtilities } from '@md-oss/design-system/components/dev-utilities';
import {
  defaultTheme,
  defaultThemes,
} from '@md-oss/design-system/components/theme/registry';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Providers>
          <RootProvider
            search={{
              enabled: true,
            }}
            theme={{
              themes: [...defaultThemes],
              defaultTheme: defaultTheme,
              forcedTheme: 'dark',
            }}
          >
            {children}
            <DevUtilities enabled={process.env.NODE_ENV !== 'production'} />
          </RootProvider>
        </Providers>
      </body>
    </html>
  );
}
