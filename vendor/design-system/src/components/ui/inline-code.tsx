import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import type * as React from 'react';

export type InlineCodeProps = {
	children?: React.ReactNode;
	className?: string;
	slotProps?: {
		root?: WithAsComponent<React.HTMLAttributes<HTMLElement>>;
	};
};

export function InlineCode({
	children,
	className,
	slotProps,
}: InlineCodeProps) {
	const [RootEl, rootSlotProps] = resolveSlot('code', slotProps?.root);

	const rootProps = mergePropsWithClassName<React.HTMLAttributes<HTMLElement>>(
		{
			className:
				'inline rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.875em] leading-snug text-foreground',
		},
		rootSlotProps,
		className
	);

	return <RootEl {...rootProps}>{children}</RootEl>;
}
