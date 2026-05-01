import { mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import type React from 'react';

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
	const listProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLUListElement>
	>(
		{
			className:
				'w-full list-none flex flex-col md:flex-row flex-wrap gap-2 items-center md:justify-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500',
		},
		slotProps?.list,
		className
	);

	return (
		<ul {...listProps}>
			{children.map((child, index) => {
				const itemProps = mergePropsWithClassName<
					React.HTMLAttributes<HTMLLIElement>
				>(
					{
						className:
							'animate-in fade-in-0 slide-in-from-bottom-2 duration-300',
						style: {
							animationDelay: `${Math.min(index * staggerDelay, maxDelay)}ms`,
							animationFillMode: 'backwards',
						},
					},
					slotProps?.item,
					classNames?.item
				);

				return (
					<li key={index} {...itemProps}>
						{child}
					</li>
				);
			})}
		</ul>
	);
}
