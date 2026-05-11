'use client';

import type { AuthPluginBase } from '@better-auth-ui/core';
import { useAuth } from '@better-auth-ui/react';
import { DangerZone } from '@md-oss/design-system/components/auth/delete-user/danger-zone';
import { ActiveSessions } from '@md-oss/design-system/components/auth/settings/security/active-sessions';
import { cn } from '@md-oss/design-system/lib/utils';

export type SessionsSettingsProps = {
	className?: string;
};

/**
 * Renders the sessions management/settings UI, including active sessions and any additional session-related security cards contributed by auth plugins.
 *
 * Each registered auth plugin may contribute `sessionsDangerZoneCards` (for example clearUserSessions).
 *
 * @param className - Optional additional CSS class names for the outer container.
 * @returns The sessions settings container as a JSX element.
 */
export function SessionsSettings({ className }: SessionsSettingsProps) {
	const { plugins } = useAuth();

	const castPlugins = plugins as (AuthPluginBase & {
		sessionsDangerZoneCards?: React.ComponentType[];
	})[];

	const pluginsWithSessionsDangerZoneCards = castPlugins.filter(
		(plugin) => plugin.sessionsDangerZoneCards?.length
	);
	return (
		<div className={cn('flex w-full flex-col gap-4 md:gap-6', className)}>
			<ActiveSessions />
			{pluginsWithSessionsDangerZoneCards.length > 0 && (
				<DangerZone>
					{pluginsWithSessionsDangerZoneCards.flatMap(
						(plugin) =>
							plugin.sessionsDangerZoneCards?.map((Card, index) => (
								<Card key={`${plugin.id}-${index.toString()}`} />
							)) ?? []
					)}
				</DangerZone>
			)}
		</div>
	);
}
