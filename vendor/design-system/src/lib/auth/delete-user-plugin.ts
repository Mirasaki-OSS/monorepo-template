import { createAuthPlugin } from '@better-auth-ui/core';
import {
	deleteUserPlugin as coreDeleteUserPlugin,
	type DeleteUserPluginOptions,
} from '@better-auth-ui/core/plugins';

import { DeleteUser } from '@md-oss/design-system/components/auth/delete-user/delete-user';

export const deleteUserPlugin = createAuthPlugin(
	coreDeleteUserPlugin.id,
	(options: DeleteUserPluginOptions = {}) => ({
		...coreDeleteUserPlugin(options),
		// securityCards: [DangerZone],
		dangerZone: [DeleteUser],
	})
);
