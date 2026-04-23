import { RootProvider } from 'fumadocs-ui/provider/next';

import './global.css';
import {
  defaultTheme,
  defaultThemes,
} from '@md-oss/design-system/components/theme/registry';
import { DesignSystemProvider } from '@md-oss/design-system/provider';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <DesignSystemProvider>
          <RootProvider
            theme={{
              themes: [...defaultThemes],
              defaultTheme: defaultTheme,
              forcedTheme: 'dark',
            }}
          >
            {children}
          </RootProvider>
        </DesignSystemProvider>
      </body>
    </html>
  );
}
