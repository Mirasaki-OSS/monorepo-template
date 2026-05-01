import {
	cn,
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

export const loaderVariants = cva('animate-spin shrink-0', {
	variants: {
		size: {
			sm: 'size-4',
			default: 'size-6',
			lg: 'size-8',
		},
		variant: {
			muted: 'text-muted-foreground',
			default: 'text-foreground',
			secondary: 'text-secondary',
			destructive: 'text-destructive',
		},
	},
	defaultVariants: {
		size: 'default',
		variant: 'default',
	},
});

export interface LoaderProps
	extends WithAsComponent<
			Omit<React.ComponentPropsWithoutRef<typeof Loader2>, 'size'>
		>,
		VariantProps<typeof loaderVariants> {
	label?: string;
}

export const Loader: React.ForwardRefExoticComponent<
	Omit<LoaderProps, 'ref'> & React.RefAttributes<SVGSVGElement>
> = React.forwardRef<SVGSVGElement, LoaderProps>(
	({ className, size, variant, label = 'Loading', ...props }, ref) => {
		const [LoaderEl, loaderSlotProps] = resolveSlot(Loader2, props);
		const loaderProps = mergePropsWithClassName<
			Omit<React.ComponentPropsWithoutRef<typeof Loader2>, 'size'>
		>(
			{
				className: cn(loaderVariants({ size, variant }), className),
			},
			loaderSlotProps
		);
		return (
			<LoaderEl
				ref={ref}
				role="status"
				aria-label={props['aria-label'] ?? label}
				{...loaderProps}
			/>
		);
	}
);

export type LoaderWithContainerProps = {
	className?: string;
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		loader?: LoaderProps;
	};
};

export const LoaderWithContainer: React.FC<LoaderWithContainerProps> = ({
	className,
	slotProps,
}) => {
	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);
	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: 'flex h-full w-full items-center justify-center',
		},
		containerSlotProps,
		className
	);
	return (
		<ContainerEl {...containerProps}>
			<Loader {...slotProps?.loader} />
		</ContainerEl>
	);
};
