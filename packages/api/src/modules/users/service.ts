import { canUser } from '@md-oss/authz';
import {
	collectFilteredCursorPage,
	collectFilteredPaginationPage,
} from '@md-oss/database';
import type { ServerAuthContext } from '../../context';
import { userNotFoundError } from './errors';
import {
	assertCanCountUsers,
	assertCanDeleteUser,
	assertCanReadUser,
	assertCanUpdateUser,
} from './policy';
import {
	countUsers,
	deleteUserById,
	findTargetUser,
	listPublicUsersView,
	listUsersBatch,
	updateUserById,
} from './repo';
import type {
	DeleteUserByIdInput,
	ListPublicUsersViewInput,
	ListUsersInput,
	UpdateUserByIdInput,
} from './schema';
import { listUsersDefinitions } from './schema';

export function listUsersDefinitionsService() {
	return listUsersDefinitions;
}

export async function getUserByIdService(
	auth: ServerAuthContext,
	targetUserId: string
) {
	const target = await findTargetUser(targetUserId);
	if (!target) {
		throw userNotFoundError();
	}

	assertCanReadUser(auth, target.auth);
	return target.view;
}

export async function listPublicUsersViewService(
	auth: ServerAuthContext,
	input: ListPublicUsersViewInput
) {
	const result = await collectFilteredCursorPage(
		(cursor, limit) =>
			listPublicUsersView({
				...input,
				cursor: cursor ?? null,
				limit,
			}),
		(item) => canUser(auth.ability, 'read', item.auth),
		(item) => item.view.id,
		{ limit: input.limit, cursor: input.cursor ?? undefined }
	);

	return {
		items: result.items.map((item) => item.view),
		nextCursor: result.nextCursor ?? null,
	};
}

export async function countUsersService(
	auth: ServerAuthContext,
	input: ListUsersInput
) {
	assertCanCountUsers(auth);

	const result = await countUsers(input);
	return {
		count: result,
	};
}

export async function listUsersService(
	auth: ServerAuthContext,
	input: ListUsersInput
) {
	const result = await collectFilteredPaginationPage(
		(page, pageSize) =>
			listUsersBatch({
				...input,
				pagination: {
					page,
					pageSize,
				},
			}),
		(item) => canUser(auth.ability, 'read', item.auth),
		input.pagination
	);

	return {
		items: result.items.map((item) => item.view),
		pagination: result.pagination,
		definitions: listUsersDefinitions,
	};
}

export async function updateUserByIdService(
	auth: ServerAuthContext,
	input: UpdateUserByIdInput
) {
	const target = await findTargetUser(input.id);
	if (!target) {
		throw userNotFoundError();
	}

	assertCanUpdateUser(auth, target.auth);

	const updated = await updateUserById(input.id, input.data);
	if (!updated) {
		throw userNotFoundError();
	}

	return updated;
}

export async function deleteUserByIdService(
	auth: ServerAuthContext,
	input: DeleteUserByIdInput
) {
	const target = await findTargetUser(input.id);
	if (!target) {
		throw userNotFoundError();
	}

	assertCanDeleteUser(auth, target.auth);

	const deleted = await deleteUserById(input.id);
	if (!deleted) {
		throw userNotFoundError();
	}

	return {
		deletedUserId: deleted.id,
	};
}
