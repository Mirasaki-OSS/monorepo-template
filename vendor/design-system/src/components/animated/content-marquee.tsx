'use client';

import {
	cn,
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import React from 'react';

type MarqueeDirection = 'left' | 'right';
type MarqueeSpeed = 'fast' | 'normal' | 'slow' | 'extra-slow';

const SPEED_TO_DURATION: Record<MarqueeSpeed, string> = {
	fast: '20s',
	normal: '40s',
	slow: '80s',
	'extra-slow': '160s',
};

type CSSVariables = React.CSSProperties & {
	'--animation-duration'?: string;
	'--animation-direction'?: string;
};

export type ContentMarqueeProps = {
	items: React.ReactNode[];
	direction?: MarqueeDirection;
	speed?: MarqueeSpeed;
	pauseOnHover?: boolean;
	fadeEdges?: boolean;
	className?: string;
	classNames?: {
		track?: string;
		item?: string;
	};
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		track?: WithAsComponent<React.HTMLAttributes<HTMLUListElement>>;
		item?: WithAsComponent<React.LiHTMLAttributes<HTMLLIElement>>;
	};
};

export function ContentMarquee({
	items,
	direction = 'left',
	speed = 'normal',
	pauseOnHover = true,
	fadeEdges = true,
	className,
	classNames,
	slotProps,
}: ContentMarqueeProps): React.JSX.Element | null {
	const contentItems = React.useMemo(
		() => items.map((item, index) => ({ item, key: `marquee-item-${index}` })),
		[items]
	);

	if (contentItems.length === 0) {
		return null;
	}

	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);
	const [TrackEl, trackSlotProps] = resolveSlot('ul', slotProps?.track);
	const [ItemEl, itemSlotProps] = resolveSlot('li', slotProps?.item);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: cn(
				'relative overflow-hidden',
				fadeEdges &&
					'mask-[linear-gradient(to_right,transparent,white_12%,white_88%,transparent)]'
			),
			style: {
				'--animation-duration': SPEED_TO_DURATION[speed],
				'--animation-direction': direction === 'left' ? 'forwards' : 'reverse',
			} as CSSVariables,
		},
		containerSlotProps,
		className
	);

	const trackProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLUListElement>
	>(
		{
			className: cn(
				'flex min-w-full w-max shrink-0 flex-nowrap gap-4',
				'animate-scroll motion-reduce:animate-none',
				pauseOnHover && 'hover:paused'
			),
		},
		trackSlotProps,
		classNames?.track
	);

	const itemProps = mergePropsWithClassName<
		React.LiHTMLAttributes<HTMLLIElement>
	>(
		{
			className: 'shrink-0',
		},
		itemSlotProps,
		classNames?.item
	);

	return (
		<ContainerEl {...containerProps}>
			<TrackEl {...trackProps}>
				{contentItems.map(({ item, key }) => (
					<ItemEl {...itemProps} key={key}>
						{item}
					</ItemEl>
				))}
				{contentItems.map(({ item, key }) => (
					<ItemEl {...itemProps} key={`${key}-duplicate`} aria-hidden="true">
						{item}
					</ItemEl>
				))}
			</TrackEl>
		</ContainerEl>
	);
}
