import { canUser } from '@md-oss/authz';
import type { AuthContext } from '../../../context';
import { forbidden } from '../errors';

export function assertCanUpdateOwnUser(auth: AuthContext) {
	if (!canUser(auth.ability, 'update', auth.actor)) {
		forbidden('You do not have permission to update this user');
	}
}

export function assertCanDeleteOwnUser(auth: AuthContext) {
	if (!canUser(auth.ability, 'delete', auth.actor)) {
		forbidden('You do not have permission to delete this user');
	}
}
