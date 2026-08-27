import { createAuthPlugin } from '@better-auth-ui/core';
import {
	passkeyPlugin as corePasskeyPlugin,
	type PasskeyPluginOptions,
} from '@better-auth-ui/core/plugins/passkey';

import { PasskeyButton } from '@md-oss/design-system/components/auth/passkey/passkey-button';
import { Passkeys } from '@md-oss/design-system/components/auth/passkey/passkeys';

export const passkeyPlugin = createAuthPlugin(
	corePasskeyPlugin.id,
	(options: PasskeyPluginOptions = {}) => ({
		...(({ id: _id, ...plugin }) => plugin)(corePasskeyPlugin(options)),
		authButtons: [PasskeyButton],
		beforeSecurityDangerZone: [Passkeys],
	})
);
