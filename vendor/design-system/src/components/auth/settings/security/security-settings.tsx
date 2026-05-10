'use client';

import type { AuthPluginBase } from '@better-auth-ui/core';
import { useAuth } from '@better-auth-ui/react';
import { cn } from '@md-oss/design-system/lib/utils';
import { DangerZone } from '../../delete-user/danger-zone';
import { ActiveSessions } from './active-sessions';
import { ChangePassword } from './change-password';
import { LinkedAccounts } from './linked-accounts';

export type SecuritySettingsProps = {
	className?: string;
};

/**
 * Renders the security settings layout including password management, linked accounts, and active sessions.
 *
 * ChangePassword is rendered when password authentication is enabled; LinkedAccounts is rendered when social providers are present.
 * Each registered auth plugin may contribute `securityDangerZoneCards` (for example passkeys, delete-user).
 *
 * @param className - Optional additional CSS class names for the outer container.
 * @returns The security settings container as a JSX element.
 */
export function SecuritySettings({ className }: SecuritySettingsProps) {
	const { emailAndPassword, plugins, socialProviders, viewPaths } = useAuth();

	const usesStandaloneSessionsView =
		'sessions' in viewPaths.settings &&
		typeof viewPaths.settings.sessions === 'string';

	const usesStandaloneLinkedAccountsView =
		'linkedAccounts' in viewPaths.settings &&
		typeof viewPaths.settings.linkedAccounts === 'string';

	const castPlugins = plugins as (AuthPluginBase & {
		beforeSecurityDangerZone?: React.ComponentType[];
		securityDangerZoneCards?: React.ComponentType[];
		sessionsDangerZoneCards?: React.ComponentType[];
		linkedAccountsDangerZoneCards?: React.ComponentType[];
	})[];

	const pluginsWithBeforeSecurityDangerZone = castPlugins.filter(
		(plugin) => plugin.beforeSecurityDangerZone?.length
	);
	const pluginsWithSecurityDangerZoneCards = castPlugins.filter(
		(plugin) => plugin.securityDangerZoneCards?.length
	);
	const pluginsWithSessionsDangerZoneCards = castPlugins.filter(
		(plugin) => plugin.sessionsDangerZoneCards?.length
	);
	const pluginsWithLinkedAccountsDangerZoneCards = castPlugins.filter(
		(plugin) => plugin.linkedAccountsDangerZoneCards?.length
	);

	const dangerZoneComponents = [
		...(!usesStandaloneSessionsView
			? pluginsWithSessionsDangerZoneCards.flatMap(
					(plugin) => plugin.sessionsDangerZoneCards ?? []
				)
			: []),
		...(!usesStandaloneLinkedAccountsView
			? pluginsWithLinkedAccountsDangerZoneCards.flatMap(
					(plugin) => plugin.linkedAccountsDangerZoneCards ?? []
				)
			: []),
		...pluginsWithSecurityDangerZoneCards.flatMap(
			(plugin) => plugin.securityDangerZoneCards ?? []
		),
	];

	return (
		<div className={cn('flex w-full flex-col gap-4 md:gap-6', className)}>
			{emailAndPassword?.enabled && <ChangePassword />}
			{!!socialProviders?.length && !usesStandaloneLinkedAccountsView && (
				<LinkedAccounts />
			)}
			{!usesStandaloneSessionsView && <ActiveSessions />}

			{pluginsWithBeforeSecurityDangerZone.map((plugin, index) => (
				<div key={`danger-zone-plugin-${index}`}>
					{plugin.beforeSecurityDangerZone?.map((Component, idx) => (
						<Component key={`danger-zone-${index}-${idx}`} />
					))}
				</div>
			))}

			{dangerZoneComponents.length > 0 && (
				<DangerZone>
					{dangerZoneComponents.map((Card, index) => (
						<Card key={`danger-zone-${index}`} />
					))}
				</DangerZone>
			)}
		</div>
	);
}
