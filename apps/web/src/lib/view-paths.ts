import type { PartialExtendedViewPaths } from '@md-oss/design-system/components/auth/pages/view-paths';
import { magicLinkPlugin } from '@md-oss/design-system/lib/auth/magic-link-plugin';

export const customExtendedViewPaths: PartialExtendedViewPaths = {
  settings: {
    apiKeys: 'zzz-keys',
    // Creates a separate tab for sessions, instead of nesting inside Security settings
    sessions: 'sessions',
    // Creates a separate tab for linked accounts (connections), instead of nesting inside Security settings
    linkedAccounts: 'connections',
  },
  auth: {
    ...magicLinkPlugin().viewPaths?.auth,
  },
};
