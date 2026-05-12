import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export * from 'class-variance-authority';
export * from 'clsx';
export * from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type WithClassName = {
	className?: string;
};

export function mergePropsWithClassName<T extends WithClassName>(
	defaults: Omit<T, 'className'> & {
		className?: ClassValue;
	},
	overrides?: T,
	...classNames: ClassValue[]
): T {
	const { className: overrideClassName, ...overrideProps } = overrides || {};
	const mergedClassName = cn(
		defaults.className,
		overrideClassName,
		...classNames
	);

	return {
		...defaults,
		...overrideProps,
		...(mergedClassName ? { className: mergedClassName } : {}),
	} as T;
}

/**
 * Adds `asComponent` to a slot props type, allowing consumers to override
 * which element or component renders for that slot.
 *
 * @example
 * slotProps?: {
 *   title?: WithAsComponent<React.HTMLAttributes<HTMLHeadingElement>>;
 * }
 * // Consumer: slotProps={{ title: { asComponent: 'h2', className: 'text-xl' } }}
 */
export type WithAsComponent<TProps extends object> = TProps & {
	asComponent?: React.ElementType<TProps>;
};

/**
 * Extracts the element type and remaining props from a slot that uses
 * `WithAsComponent`. Returns a tuple of `[ElementType, propsWithoutAsComponent]`
 * ready to spread onto the rendered element.
 *
 * @example
 * const [TitleEl, titleSlotProps] = resolveSlot('h1', slotProps?.title);
 * const titleProps = mergePropsWithClassName({ className: 'text-2xl' }, titleSlotProps, classNames?.title);
 * return <TitleEl {...titleProps}>{title}</TitleEl>;
 */
export function resolveSlot<TProps extends object>(
	defaultEl: React.ElementType<TProps>,
	slotProps?: WithAsComponent<TProps>
): [React.ElementType<TProps>, TProps | undefined] {
	if (!slotProps) return [defaultEl, undefined];
	const { asComponent, ...rest } = slotProps;
	return [
		asComponent ?? defaultEl,
		Object.keys(rest).length ? (rest as TProps) : undefined,
	];
}
