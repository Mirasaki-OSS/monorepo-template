import { canUser } from '@md-oss/authz';
import type { ServerAuthContext } from '../../../context';
import { forbidden } from '../errors';

export function assertCanUpdateOwnUser(auth: ServerAuthContext) {
	if (!canUser(auth.ability, 'update', auth.actor)) {
		forbidden('You do not have permission to update this user');
	}
}

export function assertCanDeleteOwnUser(auth: ServerAuthContext) {
	if (!canUser(auth.ability, 'delete', auth.actor)) {
		forbidden('You do not have permission to delete this user');
	}
}
