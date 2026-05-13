import { and, eq, or, sql } from '@md-oss/db';
import { account, passkey, session, user } from '@md-oss/db/schema';
import {
	type AdvancedFilterFieldConfig,
	buildAdvancedFilterClauseFromRegistry,
	buildAdvancedFilterClauses,
	createAdvancedFilterSchemas,
} from '../../lib/advanced-filters';
import type { ListUsersInput } from './schema';

const advancedFilterSchemas = createAdvancedFilterSchemas({
	ids: [
		'query',
		'email',
		'id',
		'authMethods',
		'lastSeenAt',
		'createdAt',
		'status',
	] as const,
});

export const userAdvancedFilterIdSchema = advancedFilterSchemas.idSchema;
export const userAdvancedFilterItemSchema = advancedFilterSchemas.itemSchema;
export const userAdvancedFilterJoinOperatorSchema =
	advancedFilterSchemas.joinOperatorSchema;

function normalizeAuthMethod(method: string) {
	return method.trim().toLowerCase();
}

function getUserAuthMethodFilterClause(method: string) {
	const normalizedMethod = normalizeAuthMethod(method);

	if (!normalizedMethod) {
		return undefined;
	}

	if (normalizedMethod === 'password') {
		return sql`exists (
			select 1
			from ${account}
			where ${account.userId} = ${user.id}
				and ${account.password} is not null
		)`;
	}

	if (normalizedMethod === 'passkey') {
		return sql`exists (
			select 1
			from ${passkey}
			where ${passkey.userId} = ${user.id}
		)
		or exists (
			select 1
			from ${account}
			where ${account.userId} = ${user.id}
				and lower(${account.providerId}) = 'passkey'
		)`;
	}

	return sql`exists (
		select 1
		from ${account}
		where ${account.userId} = ${user.id}
			and lower(${account.providerId}) = ${normalizedMethod}
	)`;
}

function getLastSeenAtExpression() {
	return sql<Date | null>`(
		select max(${session.updatedAt})
		from ${session}
		where ${session.userId} = ${user.id}
			and ${session.impersonatedBy} is null
	)`;
}

export function getAuthMethodsSortRankExpression() {
	return sql<number>`(
		(
			select count(distinct lower(${account.providerId}))
			from ${account}
			where ${account.userId} = ${user.id}
				and lower(${account.providerId}) not in ('credential', 'passkey')
		)
		+
		case when exists (
			select 1
			from ${account}
			where ${account.userId} = ${user.id}
				and ${account.password} is not null
		) then 1 else 0 end
		+
		case when exists (
			select 1
			from ${passkey}
			where ${passkey.userId} = ${user.id}
		) or exists (
			select 1
			from ${account}
			where ${account.userId} = ${user.id}
				and lower(${account.providerId}) = 'passkey'
		) then 1 else 0 end
	)`;
}

const userAdvancedFilterFieldConfig: Record<
	ListUsersInput['filters'][number]['id'],
	AdvancedFilterFieldConfig
> = {
	query: {
		kind: 'compositeText',
		columns: [user.name, user.email, user.username],
		emptyClause: and(
			sql`${user.name} is null or ${user.name} = ''`,
			sql`${user.email} is null or ${user.email} = ''`,
			sql`${user.username} is null or ${user.username} = ''`
		),
		notEmptyClause: or(
			sql`${user.name} is not null and ${user.name} <> ''`,
			sql`${user.email} is not null and ${user.email} <> ''`,
			sql`${user.username} is not null and ${user.username} <> ''`
		),
	},
	email: {
		kind: 'text',
		column: user.email,
	},
	id: {
		kind: 'text',
		column: user.id,
	},
	status: {
		kind: 'mapped',
		getClauseForValue: (value) => {
			const normalizedValue = normalizeAuthMethod(value);
			if (normalizedValue === 'verified') return eq(user.emailVerified, true);
			if (normalizedValue === 'unverified')
				return eq(user.emailVerified, false);
			return undefined;
		},
		notEmptyClause: sql`${user.emailVerified} is not null`,
	},
	authMethods: {
		kind: 'mapped',
		getClauseForValue: getUserAuthMethodFilterClause,
		emptyClause: sql`${getAuthMethodsSortRankExpression()} = 0`,
		notEmptyClause: sql`${getAuthMethodsSortRankExpression()} > 0`,
	},
	createdAt: {
		kind: 'date',
		column: user.createdAt,
	},
	lastSeenAt: {
		kind: 'date',
		column: getLastSeenAtExpression(),
	},
};

function getAdvancedUserFilterClause(
	filter: ListUsersInput['filters'][number]
) {
	return buildAdvancedFilterClauseFromRegistry(
		filter,
		userAdvancedFilterFieldConfig
	);
}

export function getListUserFilters(
	filters: ListUsersInput['filters'],
	joinOperator: ListUsersInput['joinOperator']
) {
	return buildAdvancedFilterClauses(
		filters,
		joinOperator,
		getAdvancedUserFilterClause
	);
}
