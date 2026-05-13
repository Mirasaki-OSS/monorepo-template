import {
	AbilityBuilder,
	createMongoAbility,
	type MongoAbility,
	subject,
} from '@casl/ability';
import { isStringArray } from '@md-oss/common/utils/arrays';

const authzRoles = ['owner', 'admin', 'support', 'user'] as const;
const authzActions = ['manage', 'create', 'read', 'update', 'delete'] as const;
const authzSubjects = ['all', 'User'] as const;

const rolePriority: Record<AuthzRole, number> = {
	owner: 4,
	admin: 3,
	support: 2,
	user: 1,
};

export type AuthzIdentity = {
	id: string;
	isOwner?: boolean;
	isAdmin?: boolean;
	isSupport?: boolean;
	role?: string | string[];
	roles?: string | string[];
	// primaryRole?: string;
};

export type AuthzActor = {
	id: string;
	roles: AuthzRole[];
	primaryRole: AuthzRole;
};

export type AuthzRole = (typeof authzRoles)[number];
export type AuthzAction = (typeof authzActions)[number];
export type AuthzSubject = (typeof authzSubjects)[number];

export type AuthzUserSubject = {
	__caslSubjectType__: 'User';
	id: string;
	primaryRole: AuthzRole;
};

type AppSubject = AuthzSubject | AuthzUserSubject;
type AuthzRoleCondition = AuthzRole | { $in: AuthzRole[] };
type AuthzConditions = {
	id?: string;
	primaryRole?: AuthzRoleCondition;
};

export type AppAbility = MongoAbility<[AuthzAction, AppSubject]>;
export type AppAbilityLike = Pick<AppAbility, 'can'>;

export type AuthzPermission = {
	action: AuthzAction;
	subject: AuthzSubject;
	scope: 'any' | 'own';
	conditions?: AuthzConditions;
};

export const rolePermissions: Record<AuthzRole, readonly AuthzPermission[]> = {
	owner: [{ action: 'manage', subject: 'all', scope: 'any' }],
	admin: [
		{ action: 'read', subject: 'User', scope: 'any' },
		{
			action: 'manage',
			subject: 'User',
			scope: 'any',
			conditions: { primaryRole: { $in: ['support', 'user'] } },
		},
	],
	support: [
		{ action: 'read', subject: 'User', scope: 'any' },
		{
			action: 'manage',
			subject: 'User',
			scope: 'any',
			conditions: { primaryRole: 'user' },
		},
	],
	user: [
		{ action: 'read', subject: 'User', scope: 'own' },
		{ action: 'update', subject: 'User', scope: 'own' },
		{ action: 'delete', subject: 'User', scope: 'own' },
	],
};

const defaultRole: AuthzRole = 'user';

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isAuthzRole(value: unknown): value is AuthzRole {
	return typeof value === 'string' && authzRoles.includes(value as AuthzRole);
}

function normalizeRoles(rawRoles: unknown): AuthzRole[] {
	const rolesArray =
		typeof rawRoles === 'string'
			? rawRoles.split(',').map((role) => role.trim())
			: isStringArray(rawRoles)
				? rawRoles
				: [];

	return [...new Set(rolesArray.filter(isAuthzRole))];
}

function resolveIdentityRoles(identity: AuthzIdentity): AuthzRole[] {
	if (!isRecord(identity)) {
		return [defaultRole];
	}

	const directRoles = normalizeRoles(identity.role);
	if (directRoles.length > 0) {
		return directRoles;
	}

	const rolesFromRolesProp = normalizeRoles(identity.roles);
	if (rolesFromRolesProp.length > 0) {
		return rolesFromRolesProp;
	}

	if (identity.isOwner === true) {
		return ['owner'];
	}

	if (identity.isAdmin === true) {
		return ['admin'];
	}

	if (identity.isSupport === true) {
		return ['support'];
	}

	return [defaultRole];
}

export function createActorFromUser(user: AuthzIdentity): AuthzActor {
	const [primaryRole, roles] = resolveRoles(resolveIdentityRoles(user));
	return {
		id: user.id,
		roles,
		primaryRole,
	};
}

export function getPrimaryRole(roles: readonly AuthzRole[]): AuthzRole {
	let primaryRole: AuthzRole = roles[0] ?? defaultRole;

	for (const role of roles) {
		if (rolePriority[role] > rolePriority[primaryRole]) {
			primaryRole = role;
		}
	}

	return primaryRole;
}

export function resolveRoles(rawRoles: unknown): [AuthzRole, AuthzRole[]] {
	const normalizedRoles = normalizeRoles(rawRoles);
	return [getPrimaryRole(normalizedRoles), normalizedRoles];
}

export function permissionsForRoles(
	roles: readonly AuthzRole[]
): AuthzPermission[] {
	const permissions = roles.flatMap((role) => rolePermissions[role]);
	const seen = new Set<string>();

	return permissions.filter((permission) => {
		const key = `${permission.action}:${permission.subject}:${permission.scope}`;
		if (seen.has(key)) {
			return false;
		}
		seen.add(key);
		return true;
	});
}

export function hasPermission(
	roles: readonly AuthzRole[],
	action: AuthzAction,
	subjectName: AuthzSubject,
	scope?: AuthzPermission['scope']
) {
	const permissions = permissionsForRoles(roles);

	return permissions.some((permission) => {
		if (permission.action !== action && permission.action !== 'manage') {
			return false;
		}

		if (permission.subject !== subjectName && permission.subject !== 'all') {
			return false;
		}

		if (!scope) {
			return true;
		}

		return permission.scope === scope;
	});
}

export function buildAbilityForActor(actor: AuthzActor): AppAbility {
	const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
	const permissions = permissionsForRoles(actor.roles);

	for (const permission of permissions) {
		const mergedConditions =
			permission.scope === 'own' && permission.subject !== 'all'
				? {
						...(permission.conditions ?? {}),
						id: actor.id,
					}
				: permission.conditions;

		if (!mergedConditions || permission.subject === 'all') {
			can(permission.action, permission.subject);
			continue;
		}

		can(permission.action, permission.subject, mergedConditions);
	}

	return build();
}

export function can(
	ability: AppAbilityLike,
	action: AuthzAction,
	subjectName: AuthzSubject
) {
	return ability.can(action, subjectName);
}

export function asUserSubject(resource: {
	id: string;
	primaryRole: AuthzRole;
}): AuthzUserSubject {
	return subject('User', {
		id: resource.id,
		primaryRole: resource.primaryRole,
	});
}

export function canUser(
	ability: AppAbilityLike,
	action: AuthzAction,
	resource: {
		id: string;
		primaryRole: AuthzRole;
	}
) {
	return ability.can(action, asUserSubject(resource));
}

export function hasScopePermission(
	roles: readonly AuthzRole[],
	action: AuthzAction,
	subjectName: AuthzSubject,
	scope: AuthzPermission['scope']
) {
	return hasPermission(roles, action, subjectName, scope);
}
