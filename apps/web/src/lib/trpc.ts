import type { AppRouter } from '@md-oss/api/routers';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { clientEnv } from './client/env';

export const createTrpc = (requestInit?: RequestInit) =>
  createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${clientEnv.NEXT_PUBLIC_API_URL}/api/v1/trpc`,
        transformer: superjson,
        fetch: (url, options) =>
          fetch(url, {
            ...requestInit,
            ...options,
            headers: {
              ...(requestInit?.headers ?? {}),
              ...(options?.headers ?? {}),
            },
          }),
      }),
    ],
  });
