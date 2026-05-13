import type { AuthContext } from '../../../context';
import { userNotFoundError } from '../errors';
import { deleteUserById, findUserById, updateUserById } from '../repo';
import { assertCanDeleteOwnUser, assertCanUpdateOwnUser } from './policy';
import type { DeleteUserInput, UpdateUserInput } from './schema';

export async function getMyUserService(auth: AuthContext) {
	const user = await findUserById(auth.actor.id);
	if (!user) {
		throw userNotFoundError();
	}

	return user;
}

export async function updateMyUserService(
	auth: AuthContext,
	input: UpdateUserInput
) {
	assertCanUpdateOwnUser(auth);

	const updated = await updateUserById(auth.actor.id, input);
	if (!updated) {
		throw userNotFoundError();
	}

	return updated;
}

export async function deleteMyUserService(
	auth: AuthContext,
	_input: DeleteUserInput
) {
	assertCanDeleteOwnUser(auth);

	const deleted = await deleteUserById(auth.actor.id);
	if (!deleted) {
		throw userNotFoundError();
	}

	return {
		deletedUserId: deleted.id,
	};
}
