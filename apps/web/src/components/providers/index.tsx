'use client';

import type { AppRouter } from '@md-oss/api/routers';
import { RouteHistoryTracker } from '@md-oss/design-system/components/route-history-tracker';
import { DesignSystemProvider } from '@md-oss/design-system/provider';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { usePathname } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import superjson from 'superjson';
import { clientEnv } from '@/lib/client/env';
import { TRPCProvider } from '@/lib/client/trpc';
import { getQueryClient } from '@/lib/query-client';
import { AuthUIProvider } from './auth-ui-provider';

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${clientEnv.NEXT_PUBLIC_API_URL}/api/v1/trpc`,
          transformer: superjson,
        }),
      ],
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
            {children}
            <RouteHistoryTracker pathname={pathname} />
          </TRPCProvider>
        </AuthUIProvider>
      </QueryClientProvider>
    </DesignSystemProvider>
  );
}
