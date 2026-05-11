import { createAuthPlugin } from '@better-auth-ui/core';
import {
	type ApiKeyPluginOptions,
	apiKeyPlugin as coreApiKeyPlugin,
} from '@better-auth-ui/core/plugins';

import { ApiKeys } from '@md-oss/design-system/components/auth/api-key/api-keys';

export const apiKeyPlugin = createAuthPlugin(
	coreApiKeyPlugin.id,
	(options: ApiKeyPluginOptions = {}) => ({
		...coreApiKeyPlugin(options),
		settingsTabs: [
			{
				id: 'apiKey',
				viewPathSettingsKey: 'apiKeys',
				pluginLocalizationKey: 'apiKeys',
				component: ApiKeys,
			},
		],
	})
);
