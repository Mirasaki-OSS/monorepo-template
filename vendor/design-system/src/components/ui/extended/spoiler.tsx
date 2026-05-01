'use client';

import { Button } from '@md-oss/design-system/components/ui/button';
import {
	cn,
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import React from 'react';

export type SpoilerProps = {
	/**
	 * The content to hide behind the spoiler.
	 */
	children: React.ReactNode;
	/**
	 * Whether the spoiler is revealed by default (uncontrolled).
	 */
	defaultRevealed?: boolean;
	/**
	 * Controlled revealed state.
	 */
	revealed?: boolean;
	/**
	 * Callback fired when the spoiler is toggled.
	 */
	onToggle?: (revealed: boolean) => void;
	/**
	 * Label for the reveal button when the content is hidden.
	 * @default "Show spoiler"
	 */
	revealLabel?: string;
	/**
	 * Label for the hide button when the content is visible.
	 * @default "Hide spoiler"
	 */
	hideLabel?: string;
	/**
	 * Visual variant.
	 * @default "minimal"
	 */
	variant?: 'minimal' | 'card';
	className?: string;
	classNames?: {
		content?: string;
		overlay?: string;
		revealButton?: string;
		hideButton?: string;
	};
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		content?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		overlay?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		revealButton?: Omit<
			React.ComponentPropsWithoutRef<typeof Button>,
			'onClick' | 'children' | 'type'
		>;
		hideButton?: Omit<
			React.ComponentPropsWithoutRef<typeof Button>,
			'onClick' | 'children' | 'type'
		>;
	};
};

export function Spoiler({
	children,
	defaultRevealed = false,
	revealed: controlledRevealed,
	onToggle,
	revealLabel = 'Show spoiler',
	hideLabel = 'Hide spoiler',
	variant = 'minimal',
	className,
	classNames,
	slotProps,
}: SpoilerProps) {
	const regionId = React.useId();
	const [internalRevealed, setInternalRevealed] =
		React.useState(defaultRevealed);
	const isControlled = controlledRevealed !== undefined;
	const isRevealed = isControlled ? controlledRevealed : internalRevealed;

	const handleToggle = () => {
		const next = !isRevealed;
		if (!isControlled) setInternalRevealed(next);
		onToggle?.(next);
	};

	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);
	const [ContentEl, contentSlotProps] = resolveSlot('div', slotProps?.content);
	const [OverlayEl, overlaySlotProps] = resolveSlot('div', slotProps?.overlay);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			role: 'region',
			'aria-labelledby': regionId,
			className: cn(
				'relative',
				variant === 'card' && 'rounded-lg border bg-card p-4'
			),
		},
		containerSlotProps,
		className
	);

	const contentProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>({ className: 'select-none' }, contentSlotProps, classNames?.content);

	const overlayProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			'aria-hidden': !isRevealed,
			className: cn(
				'absolute inset-0 flex items-center justify-center transition-opacity duration-300 bg-background/80 backdrop-blur-sm',
				variant === 'card' && 'rounded-lg',
				isRevealed && 'pointer-events-none opacity-0'
			),
		},
		overlaySlotProps,
		classNames?.overlay
	);

	const revealButtonProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Button>
	>(
		{
			variant: variant === 'minimal' ? 'ghost' : 'secondary',
			size: 'sm',
			className: cn(
				'h-full w-[calc(100%-2px)] gap-2 shadow-lg rounded-none',
				variant === 'card' && 'rounded-lg'
			),
		},
		slotProps?.revealButton,
		classNames?.revealButton
	);

	const hideButtonProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Button>
	>(
		{
			variant: 'ghost',
			size: 'sm',
			className: 'gap-2 text-muted-foreground bg-background!',
		},
		slotProps?.hideButton,
		classNames?.hideButton
	);

	return (
		<ContainerEl {...containerProps}>
			{/* Visually hidden label for the landmark region */}
			<span id={regionId} className="sr-only">
				{isRevealed ? hideLabel : revealLabel}
			</span>

			<ContentEl {...contentProps}>{children}</ContentEl>

			<OverlayEl {...overlayProps}>
				<Button
					type="button"
					aria-expanded={false}
					aria-controls={regionId}
					onClick={handleToggle}
					{...revealButtonProps}
				>
					<EyeIcon />
					{revealLabel}
				</Button>
			</OverlayEl>

			{isRevealed && (
				<div className="absolute right-0 top-0 z-10 -translate-x-0.5 translate-y-0.5">
					<Button
						type="button"
						aria-expanded={true}
						aria-controls={regionId}
						onClick={handleToggle}
						{...hideButtonProps}
					>
						<EyeOffIcon />
						{hideLabel}
					</Button>
				</div>
			)}
		</ContainerEl>
	);
}
