import { normalizePath } from '@md-oss/common/utils/urls';

export const gitConfig = {
  user: 'Mirasaki-OSS',
  repo: 'monorepo-template',
  branch: process.env.NODE_ENV === 'production' ? 'main' : 'feat/auth-ui',
};

export const githubUrl = (path = '') =>
  new URL(
    `https://github.com/${gitConfig.user}/${gitConfig.repo}${path ? normalizePath(path) : ''}`
  ).href;
