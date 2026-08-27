import { createAuthPlugin } from '@better-auth-ui/core';
import {
	deleteUserPlugin as coreDeleteUserPlugin,
	type DeleteUserPluginOptions,
} from '@better-auth-ui/core/plugins/delete-user';

import { DeleteUser } from '@md-oss/design-system/components/auth/delete-user/delete-user';

export const deleteUserPlugin = createAuthPlugin(
	coreDeleteUserPlugin.id,
	(options: DeleteUserPluginOptions = {}) => ({
		...(({ id: _id, ...plugin }) => plugin)(coreDeleteUserPlugin(options)),
		securityDangerZoneCards: [DeleteUser],
	})
);
