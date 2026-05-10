import { authMutationKeys } from '@better-auth-ui/core';
import { type AuthClient, useAuthPlugin } from '@better-auth-ui/react';
import { mutationOptions, useMutation } from '@tanstack/react-query';
import type { BetterFetchError } from 'better-auth/react';
import { clearUserSessionsPlugin } from '../clear-user-sessions-plugin';

export type ClearUserSessionsParams<TAuthClient extends AuthClient> =
	Parameters<
		TAuthClient['revokeSessions'] & TAuthClient['revokeOtherSessions']
	>[0];

export type ClearUserSessionsOptions<TAuthClient extends AuthClient> = Omit<
	ReturnType<typeof clearUserSessionsOptions<TAuthClient>>,
	'mutationKey' | 'mutationFn'
>;

/**
 * Mutation options factory for clearing the authenticated user's sessions.
 *
 * @param authClient - The Better Auth client.
 */
export function clearUserSessionsOptions<TAuthClient extends AuthClient>(
	authClient: TAuthClient,
	clearCurrentSession: boolean
) {
	const mutationKey = authMutationKeys.revokeSession;

	const mutationFn = (params: ClearUserSessionsParams<TAuthClient>) =>
		authClient[clearCurrentSession ? 'revokeSessions' : 'revokeOtherSessions']({
			...params,
			fetchOptions: { ...params?.fetchOptions, throw: true },
		});

	return mutationOptions<
		Awaited<ReturnType<typeof mutationFn>>,
		BetterFetchError,
		Parameters<typeof mutationFn>[0]
	>({
		mutationKey,
		mutationFn,
	});
}

/**
 * Create a mutation for clearing the authenticated user's sessions.
 *
 * Wraps `authClient.revokeSessions` and `authClient.revokeOtherSessions` and forwards React Query mutation options
 * such as `onSuccess`, `onError`, and `retry`.
 *
 * @param authClient - The Better Auth client.
 * @param options - React Query options forwarded to `useMutation`.
 */
export function useClearUserSessions<TAuthClient extends AuthClient>(
	authClient: TAuthClient,
	options?: ClearUserSessionsOptions<TAuthClient>
) {
	const { clearCurrentSession } = useAuthPlugin(clearUserSessionsPlugin);

	return useMutation({
		...clearUserSessionsOptions(authClient, clearCurrentSession),
		...options,
	});
}
