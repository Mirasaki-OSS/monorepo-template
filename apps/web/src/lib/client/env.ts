import { clientEnv as apiClientEnv } from '@md-oss/api/env';
import { clientEnv as authClientEnv } from '@md-oss/auth/client/env';
import { createEnv } from '@t3-oss/env-core';
import z from 'zod';

export const clientEnv = () =>
  createEnv({
    extends: [apiClientEnv(), authClientEnv()],
    client: {
      NEXT_PUBLIC_SITE_URL: z.url().min(1),
    },
    server: {},
    clientPrefix: 'NEXT_PUBLIC_',
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
