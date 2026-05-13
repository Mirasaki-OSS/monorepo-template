import { type AuthzActor, canUser, hasScopePermission } from '@md-oss/authz';
import type { AuthContext } from '../../context';
import { forbidden } from './errors';

export function assertCanReadUser(auth: AuthContext, target: AuthzActor) {
	if (!canUser(auth.ability, 'read', target)) {
		forbidden('You do not have access to this user');
	}
}

export function assertCanUpdateUser(auth: AuthContext, target: AuthzActor) {
	if (!canUser(auth.ability, 'update', target)) {
		forbidden('You do not have permission to update this user');
	}
}

export function assertCanDeleteUser(auth: AuthContext, target: AuthzActor) {
	if (!canUser(auth.ability, 'delete', target)) {
		forbidden('You do not have permission to delete this user');
	}
}

export function canReadAnyUser(auth: AuthContext) {
	return hasScopePermission(auth.actor.roles, 'read', 'User', 'any');
}
