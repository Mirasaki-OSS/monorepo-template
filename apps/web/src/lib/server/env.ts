import { serverEnv as apiServerEnv } from '@md-oss/api/env';
import { serverEnv as authServerEnv } from '@md-oss/auth/server/env';
import { createEnv } from '@t3-oss/env-core';
import { clientEnv } from '../client/env';

export const serverEnv = () =>
  createEnv({
    extends: [apiServerEnv(), authServerEnv(), clientEnv()],
    client: {},
    server: {},
    clientPrefix: 'NEXT_PUBLIC_',
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
