'use client';

import type { AppRouter } from '@md-oss/api/routers';
import { DesignSystemProvider } from '@md-oss/design-system/provider';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { type ReactNode, useState } from 'react';
import superjson from 'superjson';
import { clientEnv } from '@/lib/client/env';
import { TRPCProvider } from '@/lib/client/trpc';
import { getQueryClient } from '@/lib/query-client';
import { AuthUIProvider } from './auth-ui-provider';

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `${clientEnv.NEXT_PUBLIC_API_URL}/trpc`,
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
          </TRPCProvider>
        </AuthUIProvider>
      </QueryClientProvider>
    </DesignSystemProvider>
  );
}
