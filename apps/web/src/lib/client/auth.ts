import { apiKeyClient as apiKeyClientPlugin } from '@better-auth/api-key/client';
import { createAuthClient } from '@md-oss/auth/client';
import { clientEnv } from './env';

export const authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_API_URL,
  sessionOptions: {
    refetchInterval: 60_000,
    refetchWhenOffline: true,
    refetchOnWindowFocus: true,
  },
  plugins: [apiKeyClientPlugin()],
});
