'use client';

import { useAuth } from '@better-auth-ui/react';
import { cn } from '@md-oss/design-system/lib/utils';
import type { ComponentProps } from 'react';

export type DangerZoneProps = {
	className?: string;
	children?: React.ReactNode;
};

/**
 * Renders the danger zone heading and it's components, like DeleteUser and ClearAllUserSessions.
 * Rendered if any plugins with `dangerZone` cards are registered.
 */
export function DangerZone({
	className,
	children,
	...props
}: DangerZoneProps & Omit<ComponentProps<'div'>, 'children' | 'className'>) {
	const { localization, plugins } = useAuth();

	const usesDeleteUserPlugin = Boolean(
		plugins.find((plugin) => plugin.id === 'deleteUser')
	);
	const usesClearUserSessionsPlugin = Boolean(
		plugins.find((plugin) => plugin.id === 'clearUserSessions')
	);

	if (!usesDeleteUserPlugin && !usesClearUserSessionsPlugin) {
		console.warn(
			'The DangerZone component is intended for use within the SecuritySettings component and relies on the presence of auth plugins that register danger zone cards (such as deleteUserPlugin). Ensure that you have registered the appropriate plugins and are using DangerZone within the correct context.'
		);
	}

	return (
		<div className={cn('flex w-full flex-col', className)} {...props}>
			<h2 className="text-sm font-semibold mb-3 text-destructive">
				{localization.settings.dangerZone}
			</h2>

			<div className="flex w-full flex-col space-y-4">{children}</div>
		</div>
	);
}
