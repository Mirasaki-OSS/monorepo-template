'use client';

import {
	cn,
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { useAnimate, useReducedMotion } from 'motion/react';
import React from 'react';

type MarqueeDirection = 'left' | 'right';
type MarqueeSpeed = 'fast' | 'normal' | 'slow' | 'extra-slow';

const SPEED_TO_DURATION_SECONDS: Record<MarqueeSpeed, number> = {
	fast: 20,
	normal: 40,
	slow: 80,
	'extra-slow': 160,
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
	const prefersReducedMotion = useReducedMotion();
	const [trackScope, animate] = useAnimate();
	const contentItems = React.useMemo(
		() => items.map((item, index) => ({ item, key: `marquee-item-${index}` })),
		[items]
	);
	const animationRef = React.useRef<ReturnType<typeof animate> | null>(null);

	if (contentItems.length === 0) {
		return null;
	}

	const shouldAnimate = !prefersReducedMotion;

	React.useEffect(() => {
		const element = trackScope.current;
		if (!element || !shouldAnimate) {
			animationRef.current?.stop();
			animationRef.current = null;
			return;
		}

		const fromX = direction === 'left' ? '0%' : '-50%';
		const toX = direction === 'left' ? '-50%' : '0%';

		animationRef.current?.stop();
		animationRef.current = animate(
			element,
			{ x: [fromX, toX] },
			{
				duration: SPEED_TO_DURATION_SECONDS[speed],
				ease: 'linear',
				repeat: Number.POSITIVE_INFINITY,
			}
		);

		return () => {
			animationRef.current?.stop();
			animationRef.current = null;
		};
	}, [animate, direction, shouldAnimate, speed, trackScope]);

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
		},
		containerSlotProps,
		className
	);

	const trackProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLUListElement>
	>(
		{
			className: cn('flex min-w-full w-max shrink-0 flex-nowrap gap-4'),
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

	const handleMouseEnter: React.MouseEventHandler<HTMLDivElement> = (event) => {
		if (pauseOnHover) {
			animationRef.current?.pause();
		}

		containerProps.onMouseEnter?.(event);
	};

	const handleMouseLeave: React.MouseEventHandler<HTMLDivElement> = (event) => {
		if (pauseOnHover) {
			animationRef.current?.play();
		}

		containerProps.onMouseLeave?.(event);
	};

	return (
		<ContainerEl
			{...containerProps}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			<div
				ref={trackScope}
				className="flex w-max will-change-transform"
				style={
					shouldAnimate
						? {
								transform: `translateX(${direction === 'left' ? '0%' : '-50%'})`,
							}
						: undefined
				}
			>
				<TrackEl {...trackProps}>
					{contentItems.map(({ item, key }) => (
						<ItemEl {...itemProps} key={key}>
							{item}
						</ItemEl>
					))}
					{shouldAnimate
						? contentItems.map(({ item, key }) => (
								<ItemEl
									{...itemProps}
									key={`${key}-duplicate`}
									aria-hidden="true"
								>
									{item}
								</ItemEl>
							))
						: null}
				</TrackEl>
			</div>
		</ContainerEl>
	);
}
