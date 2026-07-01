'use client';

import { RouteHistoryTracker } from '@md-oss/design-system/components/route-history-tracker';
import { DesignSystemProvider } from '@md-oss/design-system/provider';
import { QueryClientProvider } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { type ReactNode, useState } from 'react';
import { TRPCProvider } from '@/lib/client/trpc';
import { getQueryClient } from '@/lib/query-client';
import { createTrpc } from '@/lib/trpc';
import { AuthUIProvider } from './auth-ui-provider';

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTrpc({
      credentials: 'include',
    })
  );

  return (
    <DesignSystemProvider useToaster useAdaptiveTooltip useTouchContext>
      <QueryClientProvider client={queryClient}>
        <AuthUIProvider queryClient={queryClient}>
          <TRPCProvider
            queryClient={queryClient}
            trpcClient={trpcClient}
            keyPrefix="api"
          >
            <NuqsAdapter>{children}</NuqsAdapter>
            <RouteHistoryTracker pathname={pathname} />
          </TRPCProvider>
        </AuthUIProvider>
      </QueryClientProvider>
    </DesignSystemProvider>
  );
}
