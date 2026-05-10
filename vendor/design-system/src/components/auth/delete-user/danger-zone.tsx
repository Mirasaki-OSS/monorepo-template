'use client';

import { useAuth } from '@better-auth-ui/react';
import { cn } from '@md-oss/design-system/lib/utils';
import type { ComponentProps } from 'react';

export type DangerZoneProps = {
	className?: string;
	children?: React.ReactNode;
};

/**
 * Renders the danger zone heading layout
 */
export function DangerZone({
	className,
	children,
	...props
}: DangerZoneProps & Omit<ComponentProps<'div'>, 'children' | 'className'>) {
	const { localization } = useAuth();

	return (
		<div className={cn('flex w-full flex-col', className)} {...props}>
			<h2 className="text-sm font-semibold mb-3 text-destructive">
				{localization.settings.dangerZone}
			</h2>

			<div className="flex w-full flex-col space-y-4">{children}</div>
		</div>
	);
}
