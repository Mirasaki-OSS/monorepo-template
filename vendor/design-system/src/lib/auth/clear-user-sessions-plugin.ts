import { createAuthPlugin } from '@better-auth-ui/core';
import { ClearAllUserSessions } from '@md-oss/design-system/components/auth/delete-user/clear-user-sessions';

export declare const clearUserSessionsLocalization: {
	/** @remarks `"Clear sessions"` */
	clearSessions: string;
	/** @remarks `"This will log you out of all sessions across all your devices."` */
	clearUserSessionsWithCurrentDescription: string;
	/** @remarks `"This will log you out of all sessions across all your devices, including the current one. You will need to log in again on this device to continue using the app."` */
	clearUserSessionsWithoutCurrentDescription: string;
	/** @remarks `"All sessions have been cleared successfully."` */
	clearUserSessionsWithCurrentSuccess: string;
	/** @remarks `"All sessions except the current one have been cleared successfully."` */
	clearUserSessionsWithoutCurrentSuccess: string;
	/** @remarks `"Resolved {"clearUserSessionsWithCurrentDescription" or "clearUserSessionsWithoutCurrentDescription"} based on the clearCurrentSession option.` */
	clearUserSessionsDescription: string;
	/** @remarks `"Resolved {"clearUserSessionsWithCurrentSuccess" or "clearUserSessionsWithoutCurrentSuccess"} based on the clearCurrentSession option.` */
	clearUserSessionsSuccess: string;
};
export type ClearUserSessionsLocalization =
	typeof clearUserSessionsLocalization;

export type ClearUserSessionsPluginOptions = {
	/**
	 * When `true`, after clearing all sessions, the plugin will also clear the current session, logging the user out immediately. Defaults to `false`, meaning the user will remain logged in on the current session after clearing all other sessions.
	 */
	clearCurrentSession?: boolean;
	/**
	 * Override the plugin's default localization strings.
	 * @remarks `ClearUserSessionsLocalization`
	 */
	localization?: Partial<ClearUserSessionsLocalization>;
};

export type CoreClearUserSessionsPlugin = (
	options?: ClearUserSessionsPluginOptions | undefined
) => {
	id: 'clearUserSessions';
	localization: {
		clearSessions: string;
		clearUserSessionsWithCurrentDescription: string;
		clearUserSessionsWithoutCurrentDescription: string;
		clearUserSessionsWithCurrentSuccess: string;
		clearUserSessionsWithoutCurrentSuccess: string;
		clearUserSessionsDescription: string;
		clearUserSessionsSuccess: string;
	};
	clearCurrentSession: boolean;
};

export const coreClearUserSessionsPlugin: CoreClearUserSessionsPlugin = (
	options
) => {
	const { localization: optionsLocalization, clearCurrentSession = false } =
		options || {};

	const clearUserSessionsWithCurrentDescription =
		'This will log you out of all sessions across all your devices, including the current one. You will need to log in again on this device to continue using the app.';
	const clearUserSessionsWithoutCurrentDescription =
		'This will log you out of all sessions across all your devices, except the current one.';

	const clearUserSessionsWithCurrentSuccess =
		'All sessions have been cleared successfully.';
	const clearUserSessionsWithoutCurrentSuccess =
		'All sessions except the current one have been cleared successfully.';

	const localization = {
		clearSessions: 'Clear sessions',
		clearUserSessionsWithCurrentDescription,
		clearUserSessionsWithoutCurrentDescription,
		clearUserSessionsWithCurrentSuccess,
		clearUserSessionsWithoutCurrentSuccess,
		clearUserSessionsDescription: clearCurrentSession
			? clearUserSessionsWithCurrentDescription
			: clearUserSessionsWithoutCurrentDescription,
		clearUserSessionsSuccess: clearCurrentSession
			? clearUserSessionsWithCurrentSuccess
			: clearUserSessionsWithoutCurrentSuccess,
		...optionsLocalization,
	};

	return {
		id: 'clearUserSessions',
		localization,
		clearCurrentSession,
	} as const;
};

export const clearUserSessionsPlugin = createAuthPlugin(
	'clearUserSessions',
	(options: ClearUserSessionsPluginOptions = {}) => ({
		...coreClearUserSessionsPlugin(options),
		// securityCards: [DangerZone],
		dangerZone: [ClearAllUserSessions],
	})
);
