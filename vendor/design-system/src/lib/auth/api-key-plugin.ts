import { createAuthPlugin } from '@better-auth-ui/core';
import {
	type ApiKeyPluginOptions,
	apiKeyPlugin as coreApiKeyPlugin,
} from '@better-auth-ui/core/plugins/api-key';

import { ApiKeys } from '@md-oss/design-system/components/auth/api-key/api-keys';

export const apiKeyPlugin = createAuthPlugin(
	coreApiKeyPlugin.id,
	(options: ApiKeyPluginOptions = {}) => ({
		...(({ id: _id, ...plugin }) => plugin)(coreApiKeyPlugin(options)),
		settingsTabs: [
			{
				view: 'apiKeys',
				label: 'API keys',
				component: ApiKeys,
			},
		],
	})
);
