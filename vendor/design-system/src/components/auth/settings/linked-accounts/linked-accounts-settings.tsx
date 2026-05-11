'use client';

import type { AuthPluginBase } from '@better-auth-ui/core';
import { useAuth } from '@better-auth-ui/react';
import { DangerZone } from '@md-oss/design-system/components/auth/delete-user/danger-zone';
import { LinkedAccounts } from '@md-oss/design-system/components/auth/settings/security/linked-accounts';
import { cn } from '@md-oss/design-system/lib/utils';

export type LinkedAccountSettingsProps = {
	className?: string;
};

/**
 * Renders the linked accounts management/settings UI, including any additional provider-related security cards contributed by auth plugins.
 *
 * Each registered auth plugin may contribute `linkedAccountsDangerZoneCards` (for example clearUserSessions).
 *
 * @param className - Optional additional CSS class names for the outer container.
 * @returns The linked accounts settings container as a JSX element.
 */
export function LinkedAccountSettings({
	className,
}: LinkedAccountSettingsProps) {
	const { plugins } = useAuth();

	const castPlugins = plugins as (AuthPluginBase & {
		linkedAccountsDangerZoneCards?: React.ComponentType[];
	})[];

	const linkedAccountsDangerZoneCards = castPlugins.filter(
		(plugin) => plugin.linkedAccountsDangerZoneCards?.length
	);
	return (
		<div className={cn('flex w-full flex-col gap-4 md:gap-6', className)}>
			<LinkedAccounts />
			{linkedAccountsDangerZoneCards.length > 0 && (
				<DangerZone>
					{linkedAccountsDangerZoneCards.flatMap(
						(plugin) =>
							plugin.linkedAccountsDangerZoneCards?.map((Card, index) => (
								<Card key={`${plugin.id}-${index.toString()}`} />
							)) ?? []
					)}
				</DangerZone>
			)}
		</div>
	);
}
