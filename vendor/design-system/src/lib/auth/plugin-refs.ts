import type { AuthPluginFactory } from '@better-auth-ui/react';
import type { apiKeyPlugin } from './api-key-plugin';
import type { clearUserSessionsPlugin } from './clear-user-sessions-plugin';
import type { deleteUserPlugin } from './delete-user-plugin';
import type { magicLinkPlugin } from './magic-link-plugin';
import type { passkeyPlugin } from './passkey-plugin';
import type { themePlugin } from './theme-plugin';
import type { usernamePlugin } from './username-plugin';

/*
 * Minimal runtime stubs for `@better-auth-ui` plugins.
 *
 * `useAuthPlugin` only reads `.id` at runtime, so components can import this
 * lightweight reference instead of the full plugin factory (which imports slot
 * components and would form a circular dependency).
 */

export const apiKeyPluginRef = { id: 'apiKey' } as unknown as AuthPluginFactory<
	ReturnType<typeof apiKeyPlugin>
>;

export const clearUserSessionsPluginRef = {
	id: 'clearUserSessions',
} as unknown as AuthPluginFactory<ReturnType<typeof clearUserSessionsPlugin>>;

export const deleteUserPluginRef = {
	id: 'deleteUser',
} as unknown as AuthPluginFactory<ReturnType<typeof deleteUserPlugin>>;

export const magicLinkPluginRef = {
	id: 'magicLink',
} as unknown as AuthPluginFactory<ReturnType<typeof magicLinkPlugin>>;

export const passkeyPluginRef = {
	id: 'passkey',
} as unknown as AuthPluginFactory<ReturnType<typeof passkeyPlugin>>;

export const themePluginRef = { id: 'theme' } as unknown as AuthPluginFactory<
	ReturnType<typeof themePlugin>
>;

export const usernamePluginRef = {
	id: 'username',
} as unknown as AuthPluginFactory<ReturnType<typeof usernamePlugin>>;
