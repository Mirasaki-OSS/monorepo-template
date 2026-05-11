import {
	cn,
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import type React from 'react';

export type PageContainerProps = {
	children?: React.ReactNode;
	className?: string;
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
	};
	omitContainerPadding?: boolean;
};

export function PageContainer({
	children,
	className,
	slotProps,
	omitContainerPadding,
}: PageContainerProps): React.JSX.Element {
	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: cn(
				'container mx-auto w-full',
				!omitContainerPadding && 'px-2 sm:px-4 md:px-6 lg:px-8',
				!omitContainerPadding && 'py-2 sm:py-4 md:py-6 lg:py-8'
			),
		},
		containerSlotProps,
		className
	);

	return <ContainerEl {...containerProps}>{children}</ContainerEl>;
}

/**
 * A higher-order component that wraps a given component with the PageContainer.
 * @param Component - The React component to be wrapped with the PageContainer.
 * @returns A new React component that renders the given component inside a PageContainer.
 * @example
 * const HomePageWithContainer = WithPageContainer(HomePage);
 *
 * // In your app's routing or rendering logic
 * <HomePageWithContainer someProp={value} />
 */
export function WithPageContainer<P>(
	Component: React.ComponentType<P>
): React.FC<P & PageContainerProps> {
	return function WrappedWithPageContainer(props) {
		const { children, className, slotProps, omitContainerPadding, ...rest } =
			props;
		return (
			<PageContainer
				className={className}
				slotProps={slotProps}
				omitContainerPadding={omitContainerPadding}
			>
				<Component {...(rest as P)}>{children}</Component>
			</PageContainer>
		);
	};
}
