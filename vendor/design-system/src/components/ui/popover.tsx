'use client';

import { cn } from '@md-oss/design-system/lib/utils';
import { Popover as PopoverPrimitive } from 'radix-ui';
import type * as React from 'react';

type PopoverProps = React.ComponentProps<typeof PopoverPrimitive.Root>;

function Popover({ ...props }: PopoverProps) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

type PopoverTriggerProps = React.ComponentProps<
	typeof PopoverPrimitive.Trigger
>;

function PopoverTrigger({ ...props }: PopoverTriggerProps) {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

type PopoverContentProps = React.ComponentProps<
	typeof PopoverPrimitive.Content
>;

function PopoverContent({
	className,
	align = 'center',
	sideOffset = 4,
	...props
}: PopoverContentProps) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Content
				data-slot="popover-content"
				align={align}
				sideOffset={sideOffset}
				className={cn(
					'z-50 flex w-72 origin-(--radix-popover-content-transform-origin) flex-col gap-4 rounded-md bg-popover p-4 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
					className
				)}
				{...props}
			/>
		</PopoverPrimitive.Portal>
	);
}

type PopoverAnchorProps = React.ComponentProps<typeof PopoverPrimitive.Anchor>;

function PopoverAnchor({ ...props }: PopoverAnchorProps) {
	return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

type PopoverHeaderProps = React.ComponentProps<'div'>;

function PopoverHeader({ className, ...props }: PopoverHeaderProps) {
	return (
		<div
			data-slot="popover-header"
			className={cn('flex flex-col gap-1 text-sm', className)}
			{...props}
		/>
	);
}

type PopoverTitleProps = React.ComponentProps<'h2'>;

function PopoverTitle({ className, ...props }: PopoverTitleProps) {
	return (
		<div
			data-slot="popover-title"
			className={cn('font-heading font-medium', className)}
			{...props}
		/>
	);
}

type PopoverDescriptionProps = React.ComponentProps<'p'>;

function PopoverDescription({ className, ...props }: PopoverDescriptionProps) {
	return (
		<p
			data-slot="popover-description"
			className={cn('text-muted-foreground', className)}
			{...props}
		/>
	);
}

export {
	Popover,
	PopoverAnchor,
	type PopoverAnchorProps,
	PopoverContent,
	type PopoverContentProps,
	PopoverDescription,
	type PopoverDescriptionProps,
	PopoverHeader,
	type PopoverHeaderProps,
	type PopoverProps,
	PopoverTitle,
	type PopoverTitleProps,
	PopoverTrigger,
	type PopoverTriggerProps,
};
