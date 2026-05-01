import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { ExternalLinkIcon } from 'lucide-react';
import type React from 'react';

export type ExternalLinkProps = {
	href: string;
	children: React.ReactNode;
	className?: string;
	classNames?: {
		icon?: string;
	};
	slotProps?: {
		anchor?: WithAsComponent<React.AnchorHTMLAttributes<HTMLAnchorElement>>;
		icon?: React.SVGAttributes<SVGElement>;
	};
	/**
	 * Hide the external link icon.
	 * @default false
	 */
	hideIcon?: boolean;
};

export function ExternalLink({
	href,
	children,
	className,
	classNames,
	slotProps,
	hideIcon = false,
}: ExternalLinkProps): React.JSX.Element {
	const [AnchorEl, anchorSlotProps] = resolveSlot('a', slotProps?.anchor);

	const anchorProps = mergePropsWithClassName<
		React.AnchorHTMLAttributes<HTMLAnchorElement>
	>(
		{
			href,
			target: '_blank',
			rel: 'noopener noreferrer',
			className:
				'inline-flex items-center gap-1 underline underline-offset-4 decoration-muted-foreground/40 hover:decoration-foreground transition-colors',
		},
		anchorSlotProps,
		className
	);

	const iconProps = mergePropsWithClassName<React.SVGAttributes<SVGElement>>(
		{ className: 'size-3 shrink-0 translate-y-px' },
		slotProps?.icon,
		classNames?.icon
	);

	return (
		<AnchorEl {...anchorProps}>
			{children}
			{!hideIcon && <ExternalLinkIcon {...iconProps} />}
		</AnchorEl>
	);
}
