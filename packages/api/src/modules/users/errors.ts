import { TRPCError } from '@trpc/server';

export function userNotFoundError() {
	return new TRPCError({
		code: 'NOT_FOUND',
		message: 'User not found',
	});
}

export function forbidden(message: string): never {
	throw new TRPCError({
		code: 'FORBIDDEN',
		message,
	});
}
