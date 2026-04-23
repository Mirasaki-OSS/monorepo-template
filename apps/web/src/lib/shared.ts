import { clientEnv } from './client/env';

const env = clientEnv();

export const appName = env.NEXT_PUBLIC_SITE_NAME;
export const docsRoute = '/docs';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

// fill this with your actual GitHub info, for example:
export const gitConfig = {
  user: 'Mirasaki-OSS',
  repo: 'monorepo-template',
  branch: process.env.NODE_ENV === 'production' ? 'main' : 'feat/auth-ui',
};
