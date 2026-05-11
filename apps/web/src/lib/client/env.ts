import { clientEnv as apiClientEnv } from '@md-oss/api/env';
import { createEnv } from '@t3-oss/env-core';

export const clientEnv = createEnv({
  extends: [apiClientEnv()],
  client: {},
  server: {},
  clientPrefix: 'NEXT_PUBLIC_',
  runtimeEnv: {},
  emptyStringAsUndefined: true,
});
