import type { ViewPaths } from '@better-auth-ui/core';
import { viewPaths } from '@better-auth-ui/core';

export type ExtendedViewPaths = Omit<ViewPaths, 'settings'> & {
	settings: ViewPaths['settings'] & {
		apiKeys: string;
		sessions: string;
		linkedAccounts: string;
	};
};

export const extendedViewPaths: ExtendedViewPaths = {
	...viewPaths,
	settings: {
		...viewPaths.settings,
		apiKeys: 'apiKeys',
		sessions: 'sessions',
		linkedAccounts: 'connections',
	},
	auth: {
		...viewPaths.auth,
	},
};

export type PartialExtendedViewPaths = {
	settings?: Partial<ExtendedViewPaths['settings']>;
	auth?: Partial<ExtendedViewPaths['auth']>;
};

export const mergeViewPaths = (
	defaultPaths: ExtendedViewPaths,
	customPaths?: PartialExtendedViewPaths
): ExtendedViewPaths => ({
	auth: {
		...defaultPaths.auth,
		...customPaths?.auth,
	},
	settings: {
		...defaultPaths.settings,
		...customPaths?.settings,
	},
});
