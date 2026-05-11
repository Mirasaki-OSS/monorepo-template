'use client';

import { mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import { useAnimate, useReducedMotion } from 'motion/react';
import React from 'react';

export type StaggeredListProps = {
	children: React.ReactNode[];
	className?: string;
	classNames?: {
		item?: string;
	};
	staggerDelay?: number;
	maxDelay?: number;
	slotProps?: {
		list?: React.HTMLAttributes<HTMLUListElement>;
		item?: React.HTMLAttributes<HTMLLIElement>;
	};
};

/**
 * A list component that applies staggered animations to its children.
 * Each child will fade in and slide up with a delay based on its index, creating a cascading effect.
 * The delay and animation duration can be customized via props.
 */
export function StaggeredList({
	children,
	className,
	classNames,
	staggerDelay = 50,
	maxDelay = 500,
	slotProps,
}: StaggeredListProps): React.JSX.Element {
	const prefersReducedMotion = useReducedMotion();
	const [listScope, animate] = useAnimate();
	const childItems = React.useMemo(
		() => React.Children.toArray(children),
		[children]
	);
	const itemRefs = React.useRef<Array<HTMLLIElement | null>>([]);

	itemRefs.current = childItems.map(
		(_, index) => itemRefs.current[index] ?? null
	);

	React.useEffect(() => {
		if (!listScope.current || prefersReducedMotion || childItems.length === 0) {
			return;
		}

		const itemElements = itemRefs.current.filter(
			(itemElement): itemElement is HTMLLIElement => itemElement !== null
		);

		const controls = itemElements.map((itemElement, index) =>
			animate(
				itemElement,
				{ opacity: 1, y: 0 },
				{
					duration: 0.3,
					delay: Math.min(index * staggerDelay, maxDelay) / 1000,
					ease: 'easeOut',
				}
			)
		);

		return () => {
			controls.forEach((control) => {
				control.stop();
			});
		};
	}, [
		animate,
		childItems.length,
		listScope,
		maxDelay,
		prefersReducedMotion,
		staggerDelay,
	]);

	const listProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLUListElement>
	>(
		{
			className:
				'w-full list-none flex flex-col md:flex-row flex-wrap gap-2 items-center md:justify-center',
		},
		slotProps?.list,
		className
	);

	return (
		<ul {...listProps} ref={listScope}>
			{childItems.map((child, index) => {
				const itemProps = mergePropsWithClassName<
					React.HTMLAttributes<HTMLLIElement>
				>(
					{
						className: classNames?.item,
						style: {
							opacity: prefersReducedMotion ? 1 : 0,
							transform: prefersReducedMotion
								? undefined
								: 'translateY(0.5rem)',
						},
					},
					slotProps?.item
				);

				return (
					<li
						key={index}
						{...itemProps}
						ref={(element) => {
							itemRefs.current[index] = element;
						}}
					>
						{child}
					</li>
				);
			})}
		</ul>
	);
}
