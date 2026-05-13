import { type AuthzActor, createActorFromUser } from '@md-oss/authz';
import { and, asc, db, desc, eq, gt, inArray, sql } from '@md-oss/db';
import { account, passkey, session, user } from '@md-oss/db/schema';
import type { PublicUserView, UserSelect, UserView } from '@md-oss/db/zod';
import type { UpdateUserInput } from './@me/schema';
import {
	getAuthMethodsSortRankExpression,
	getListUserFilters,
} from './filters';
import type { ListPublicUsersViewInput, ListUsersInput } from './schema';

export type TargetUser<ViewType = UserView> = {
	view: ViewType;
	auth: AuthzActor;
};

const hiddenProviderIds = new Set(['credential']);

async function getLastSeenAtByUserIds(userIds: string[]) {
	if (userIds.length === 0) {
		return new Map<string, Date | null>();
	}

	const rows = await db
		.select({
			userId: session.userId,
			lastSeenAt: sql<Date | null>`max(${session.updatedAt})`.mapWith(
				session.updatedAt
			),
		})
		.from(session)
		.where(
			and(
				inArray(session.userId, userIds),
				sql`${session.impersonatedBy} is null`
			)
		)
		.groupBy(session.userId);

	return new Map(rows.map((row) => [row.userId, row.lastSeenAt]));
}

function normalizeAuthMethod(method: string) {
	return method.trim().toLowerCase();
}

function buildAuthMethodsFromAccountRow(row: {
	providerId: string;
	password: string | null;
}): string[] {
	const methods: string[] = [];
	const providerId = normalizeAuthMethod(row.providerId);

	if (row.password) {
		methods.push('password');
	}

	if (providerId && !hiddenProviderIds.has(providerId)) {
		methods.push(providerId);
	}

	return methods;
}

function toSortedAuthMethods(methods: Iterable<string>): string[] {
	return Array.from(new Set(methods)).sort((a, b) => a.localeCompare(b));
}

async function getAuthMethodsByUserIds(userIds: string[]) {
	if (userIds.length === 0) {
		return new Map<string, string[]>();
	}

	const [accountRows, passkeyRows] = await Promise.all([
		db
			.select({
				userId: account.userId,
				providerId: account.providerId,
				password: account.password,
			})
			.from(account)
			.where(inArray(account.userId, userIds)),
		db
			.select({
				userId: passkey.userId,
			})
			.from(passkey)
			.where(inArray(passkey.userId, userIds))
			.groupBy(passkey.userId),
	]);

	const methodsByUserId = new Map<string, Set<string>>();

	for (const userId of userIds) {
		methodsByUserId.set(userId, new Set());
	}

	for (const row of accountRows) {
		const methodSet = methodsByUserId.get(row.userId) ?? new Set<string>();
		for (const method of buildAuthMethodsFromAccountRow(row)) {
			methodSet.add(method);
		}
		methodsByUserId.set(row.userId, methodSet);
	}

	for (const row of passkeyRows) {
		const methodSet = methodsByUserId.get(row.userId) ?? new Set<string>();
		methodSet.add('passkey');
		methodsByUserId.set(row.userId, methodSet);
	}

	return new Map(
		Array.from(methodsByUserId.entries()).map(([userId, methodSet]) => [
			userId,
			toSortedAuthMethods(methodSet),
		])
	);
}

async function getUserEnrichments(userIds: string[]) {
	const [lastSeenAtByUserId, authMethodsByUserId] = await Promise.all([
		getLastSeenAtByUserIds(userIds),
		getAuthMethodsByUserIds(userIds),
	]);

	return {
		lastSeenAtByUserId,
		authMethodsByUserId,
	};
}

function mapUserToView(
	record: UserSelect,
	lastSeenAt: Date | null,
	authMethods: string[]
): UserView {
	return {
		id: record.id,
		name: record.name,
		email: record.email,
		emailVerified: record.emailVerified,
		image: record.image,
		username: record.username,
		displayUsername: record.displayUsername,
		bio: record.bio,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
		lastSeenAt,
		authMethods,
	};
}

function mapUserToPublicView(record: UserSelect): PublicUserView {
	return {
		id: record.id,
		name: record.name,
		image: record.image,
		username: record.username,
		displayUsername: record.displayUsername,
		bio: record.bio,
	};
}

function mapRecordToTargetUser(
	record: UserSelect,
	lastSeenAt: Date | null,
	authMethods: string[]
): TargetUser {
	return {
		view: mapUserToView(record, lastSeenAt, authMethods),
		auth: createActorFromUser(record),
	};
}

function mapRecordToPublicUser(record: UserSelect): TargetUser<PublicUserView> {
	return {
		view: mapUserToPublicView(record),
		auth: createActorFromUser(record),
	};
}

function getListUserOrderBy(sorting: ListUsersInput['sorting']) {
	if (sorting.length === 0) {
		return [desc(user.createdAt), desc(user.id)];
	}

	return sorting.flatMap((sort) => {
		const authMethodsRankExpression = getAuthMethodsSortRankExpression();

		switch (sort.id) {
			case 'query':
			case 'name':
				return sort.desc ? [desc(user.name)] : [asc(user.name)];
			case 'email':
				return sort.desc ? [desc(user.email)] : [asc(user.email)];
			case 'id':
				return sort.desc ? [desc(user.id)] : [asc(user.id)];
			case 'username':
				return sort.desc ? [desc(user.username)] : [asc(user.username)];
			case 'displayUsername':
				return sort.desc
					? [desc(user.displayUsername)]
					: [asc(user.displayUsername)];
			case 'status':
				return sort.desc
					? [desc(user.emailVerified)]
					: [asc(user.emailVerified)];
			case 'authMethods':
				return sort.desc
					? [desc(authMethodsRankExpression)]
					: [asc(authMethodsRankExpression)];
			case 'createdAt':
				return sort.desc ? [desc(user.createdAt)] : [asc(user.createdAt)];
			case 'updatedAt':
				return sort.desc ? [desc(user.updatedAt)] : [asc(user.updatedAt)];
			default:
				return [];
		}
	});
}

export async function findUserById(userId: string) {
	const [record] = await db
		.select()
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!record) {
		return null;
	}

	const { lastSeenAtByUserId, authMethodsByUserId } = await getUserEnrichments([
		record.id,
	]);
	return mapUserToView(
		record,
		lastSeenAtByUserId.get(record.id) ?? null,
		authMethodsByUserId.get(record.id) ?? []
	);
}

export async function findTargetUser(
	userId: string
): Promise<TargetUser | null> {
	const [record] = await db
		.select()
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (!record) {
		return null;
	}

	const { lastSeenAtByUserId, authMethodsByUserId } = await getUserEnrichments([
		record.id,
	]);
	return mapRecordToTargetUser(
		record,
		lastSeenAtByUserId.get(record.id) ?? null,
		authMethodsByUserId.get(record.id) ?? []
	);
}

export async function listPublicUsersView(input: ListPublicUsersViewInput) {
	const { cursor, limit, filters, joinOperator, sorting } = input;
	const whereClause = getListUserFilters(filters, joinOperator);
	const orderBy = getListUserOrderBy(sorting);

	const rows = await db
		.select()
		.from(user)
		.where(and(cursor ? gt(user.id, cursor) : undefined, whereClause))
		.orderBy(asc(user.id), ...orderBy)
		.limit(limit + 1);

	const hasMore = rows.length > limit;
	const page = hasMore ? rows.slice(0, limit) : rows;

	return {
		items: page.map(mapRecordToPublicUser),
		nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
	};
}

export async function listUsersBatch(input: ListUsersInput) {
	const { pagination, filters, sorting } = input;
	const offset = (pagination.page - 1) * pagination.pageSize;
	const whereClause = getListUserFilters(filters, input.joinOperator);
	const orderBy = getListUserOrderBy(sorting);

	const rows = await db
		.select()
		.from(user)
		.where(whereClause)
		.orderBy(...orderBy)
		.limit(pagination.pageSize)
		.offset(offset);

	const userIds = rows.map((row) => row.id);
	const { lastSeenAtByUserId, authMethodsByUserId } =
		await getUserEnrichments(userIds);

	return {
		items: rows.map((record) =>
			mapRecordToTargetUser(
				record,
				lastSeenAtByUserId.get(record.id) ?? null,
				authMethodsByUserId.get(record.id) ?? []
			)
		),
	};
}

export async function listUsers(input: ListUsersInput) {
	const { pagination, filters } = input;
	const whereClause = getListUserFilters(filters, input.joinOperator);

	const countRows = await db
		.select({
			totalCount: sql<number>`count(*)::int`,
		})
		.from(user)
		.where(whereClause);
	const totalCount = countRows[0]?.totalCount ?? 0;
	const batch = await listUsersBatch(input);

	return {
		items: batch.items,
		pagination: {
			totalCount,
			pageCount: Math.max(1, Math.ceil(totalCount / pagination.pageSize)),
			page: pagination.page,
			pageSize: pagination.pageSize,
		},
	};
}

export async function updateUserById(userId: string, input: UpdateUserInput) {
	const [updated] = await db
		.update(user)
		.set({
			...input,
			updatedAt: new Date(),
		})
		.where(eq(user.id, userId))
		.returning();

	if (!updated) {
		return null;
	}

	const { lastSeenAtByUserId, authMethodsByUserId } = await getUserEnrichments([
		updated.id,
	]);
	return mapUserToView(
		updated,
		lastSeenAtByUserId.get(updated.id) ?? null,
		authMethodsByUserId.get(updated.id) ?? []
	);
}

export async function deleteUserById(userId: string) {
	const [deleted] = await db
		.delete(user)
		.where(eq(user.id, userId))
		.returning({ id: user.id });
	return deleted ?? null;
}
