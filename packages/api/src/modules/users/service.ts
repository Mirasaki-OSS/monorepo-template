import { canUser } from '@md-oss/authz';
import {
	collectFilteredCursorPage,
	collectFilteredPaginationPage,
} from '@md-oss/database';
import type { AuthContext } from '../../context';
import { userNotFoundError } from './errors';
import {
	assertCanDeleteUser,
	assertCanReadUser,
	assertCanUpdateUser,
} from './policy';
import {
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

export async function getUserByIdService(
	auth: AuthContext,
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
	auth: AuthContext,
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

export async function listUsersService(
	auth: AuthContext,
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
	};
}

export async function updateUserByIdService(
	auth: AuthContext,
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
	auth: AuthContext,
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
