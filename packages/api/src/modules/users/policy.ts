import { type AuthzActor, canUser, hasScopePermission } from '@md-oss/authz';
import type { ServerAuthContext } from '../../context';
import { forbidden } from './errors';

export function assertCanReadUser(auth: ServerAuthContext, target: AuthzActor) {
	if (!canUser(auth.ability, 'read', target)) {
		forbidden('You do not have access to this user');
	}
}

export function assertCanUpdateUser(
	auth: ServerAuthContext,
	target: AuthzActor
) {
	if (!canUser(auth.ability, 'update', target)) {
		forbidden('You do not have permission to update this user');
	}
}

export function assertCanDeleteUser(
	auth: ServerAuthContext,
	target: AuthzActor
) {
	if (!canUser(auth.ability, 'delete', target)) {
		forbidden('You do not have permission to delete this user');
	}
}

export function canReadAnyUser(auth: ServerAuthContext) {
	return hasScopePermission(auth.actor.roles, 'read', 'User', 'any');
}

export function canCountUsers(auth: ServerAuthContext) {
	return hasScopePermission(auth.actor.roles, 'count', 'User', 'any');
}

export function assertCanCountUsers(auth: ServerAuthContext) {
	if (!canCountUsers(auth)) {
		forbidden('You do not have permission to count users');
	}
}
