import { cn } from '@md-oss/design-system/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type * as React from 'react';

const badgeVariants = cva(
	'group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent py-0.5 font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
				secondary:
					'bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80',
				destructive:
					'bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20',
				outline:
					'border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground',
				ghost:
					'hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				sm: 'h-5 px-2 text-xs',
				default: 'h-6 px-3 text-sm',
				lg: 'h-7 px-4 text-base',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	}
);

function Badge({
	className,
	variant = 'default',
	size = 'default',
	asChild = false,
	...props
}: React.ComponentProps<'span'> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot.Root : 'span';

	return (
		<Comp
			data-slot="badge"
			data-variant={variant}
			data-size={size}
			className={cn(badgeVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
