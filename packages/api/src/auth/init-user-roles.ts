import { SinglePromiseCache } from '@md-oss/cache/single-promise-cache';
import { asc, db, eq, sql } from '@md-oss/db';
import { user } from '@md-oss/db/schema';

const initUserRolesCache = new SinglePromiseCache<void>(null);

const handleInitialUserRolesFn = async () => {
	const ownerUser = await db
		.select()
		.from(user)
		.where(sql`${user.roles} ~ '(^|,)[[:space:]]*owner[[:space:]]*(,|$)'`)
		.limit(1)
		.then((rows) => rows[0]);

	if (!ownerUser) {
		const firstCreatedUser = await db
			.select()
			.from(user)
			.orderBy(asc(user.createdAt))
			.limit(1)
			.then((rows) => rows[0]);

		if (!firstCreatedUser) {
			throw new Error(
				'No users found in the database. Please create a user before initializing roles.'
			);
		}

		await db
			.update(user)
			.set({
				roles: 'owner',
				updatedAt: new Date(),
			})
			.where(eq(user.id, firstCreatedUser.id));
	}

	return;
};

export const handleInitialUserRoles = async () => {
	await initUserRolesCache.getOrLoad(handleInitialUserRolesFn);
};
