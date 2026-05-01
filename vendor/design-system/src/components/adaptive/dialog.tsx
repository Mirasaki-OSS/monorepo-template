'use client';

import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@md-oss/design-system/components/ui/dialog';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from '@md-oss/design-system/components/ui/drawer';
import { useIsMobile } from '@md-oss/design-system/hooks/use-mobile';
import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import type React from 'react';

export type AdaptiveDialogProps = React.ComponentProps<typeof Dialog> &
	React.ComponentProps<typeof Drawer>;

export function AdaptiveDialog(props: AdaptiveDialogProps): React.JSX.Element {
	const isMobile = useIsMobile();

	return isMobile ? <Drawer {...props} /> : <Dialog {...props} />;
}

export type AdaptiveDialogTriggerProps = React.ComponentProps<
	typeof DialogTrigger
> &
	React.ComponentProps<typeof DrawerTrigger>;

export function AdaptiveDialogTrigger(
	props: AdaptiveDialogTriggerProps
): React.JSX.Element {
	const isMobile = useIsMobile();

	return isMobile ? <DrawerTrigger {...props} /> : <DialogTrigger {...props} />;
}

export type AdaptiveDialogContentProps = React.ComponentProps<
	typeof DialogContent
> &
	React.ComponentProps<typeof DrawerContent>;

export function AdaptiveDialogContent(
	props: AdaptiveDialogContentProps
): React.JSX.Element {
	const isMobile = useIsMobile();

	return isMobile ? <DrawerContent {...props} /> : <DialogContent {...props} />;
}

export type AdaptiveDialogHeaderProps = React.ComponentProps<
	typeof DialogHeader
> &
	React.ComponentProps<typeof DrawerHeader>;

export function AdaptiveDialogHeader(
	props: AdaptiveDialogHeaderProps
): React.JSX.Element {
	const isMobile = useIsMobile();

	return isMobile ? <DrawerHeader {...props} /> : <DialogHeader {...props} />;
}

export type AdaptiveDialogTitleProps = React.ComponentProps<
	typeof DialogTitle
> &
	React.ComponentProps<typeof DrawerTitle>;

export function AdaptiveDialogTitle(
	props: AdaptiveDialogTitleProps
): React.JSX.Element {
	const isMobile = useIsMobile();

	return isMobile ? <DrawerTitle {...props} /> : <DialogTitle {...props} />;
}

export type AdaptiveDialogDescriptionProps = React.ComponentProps<
	typeof DialogDescription
> &
	React.ComponentProps<typeof DrawerDescription>;

export function AdaptiveDialogDescription(
	props: AdaptiveDialogDescriptionProps
): React.JSX.Element {
	const isMobile = useIsMobile();

	return isMobile ? (
		<DrawerDescription {...props} />
	) : (
		<DialogDescription {...props} />
	);
}

export type AdaptiveDialogFooterProps = React.ComponentProps<
	typeof DialogFooter
> &
	React.ComponentProps<typeof DrawerFooter>;

export function AdaptiveDialogFooter(
	props: AdaptiveDialogFooterProps
): React.JSX.Element {
	const isMobile = useIsMobile();

	return isMobile ? <DrawerFooter {...props} /> : <DialogFooter {...props} />;
}

export type AdaptiveDialogCloseProps = React.ComponentProps<
	typeof DialogClose
> &
	React.ComponentProps<typeof DrawerClose>;

export function AdaptiveDialogClose(
	props: AdaptiveDialogCloseProps
): React.JSX.Element {
	const isMobile = useIsMobile();

	return isMobile ? <DrawerClose {...props} /> : <DialogClose {...props} />;
}

export type AdaptiveDialogPanelProps = {
	trigger: React.ReactNode;
	title: React.ReactNode;
	description?: React.ReactNode;
	children: React.ReactNode;
	footer?: React.ReactNode;
	closeAction?: React.ReactNode;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	className?: string;
	classNames?: {
		trigger?: string;
		content?: string;
		header?: string;
		title?: string;
		description?: string;
		body?: string;
		footer?: string;
	};
	slotProps?: {
		root?: AdaptiveDialogProps;
		trigger?: AdaptiveDialogTriggerProps;
		content?: AdaptiveDialogContentProps;
		header?: AdaptiveDialogHeaderProps;
		title?: AdaptiveDialogTitleProps;
		description?: AdaptiveDialogDescriptionProps;
		body?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		footer?: AdaptiveDialogFooterProps;
		close?: AdaptiveDialogCloseProps;
	};
};

export function AdaptiveDialogPanel({
	trigger,
	title,
	description,
	children,
	footer,
	closeAction,
	open,
	defaultOpen,
	onOpenChange,
	className,
	classNames,
	slotProps,
}: AdaptiveDialogPanelProps): React.JSX.Element {
	const isMobile = useIsMobile();
	const [BodyEl, bodySlotProps] = resolveSlot('div', slotProps?.body);

	const triggerProps = mergePropsWithClassName<AdaptiveDialogTriggerProps>(
		{ asChild: true },
		slotProps?.trigger,
		classNames?.trigger
	);

	const contentProps = mergePropsWithClassName<AdaptiveDialogContentProps>(
		{
			className:
				!isMobile && 'max-w-full max-h-[90%] overflow-auto sm:max-w-[425px]',
		},
		slotProps?.content,
		className,
		classNames?.content
	);

	const headerProps = mergePropsWithClassName<AdaptiveDialogHeaderProps>(
		{ className: 'max-w-full text-left' },
		slotProps?.header,
		classNames?.header
	);

	const titleProps = mergePropsWithClassName<AdaptiveDialogTitleProps>(
		{},
		slotProps?.title,
		classNames?.title
	);

	const descriptionProps =
		mergePropsWithClassName<AdaptiveDialogDescriptionProps>(
			{},
			slotProps?.description,
			classNames?.description
		);

	const bodyProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: isMobile && 'px-4',
		},
		bodySlotProps,
		classNames?.body
	);

	const footerProps = mergePropsWithClassName<AdaptiveDialogFooterProps>(
		{ className: 'sm:justify-start' },
		slotProps?.footer,
		classNames?.footer
	);

	const closeProps = mergePropsWithClassName<AdaptiveDialogCloseProps>(
		{},
		slotProps?.close
	);

	return (
		<AdaptiveDialog
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={onOpenChange}
			{...slotProps?.root}
		>
			<AdaptiveDialogTrigger {...triggerProps}>{trigger}</AdaptiveDialogTrigger>
			<AdaptiveDialogContent {...contentProps}>
				<AdaptiveDialogHeader {...headerProps}>
					<AdaptiveDialogTitle {...titleProps}>{title}</AdaptiveDialogTitle>
					{description && (
						<AdaptiveDialogDescription {...descriptionProps}>
							{description}
						</AdaptiveDialogDescription>
					)}
				</AdaptiveDialogHeader>

				<BodyEl {...bodyProps}>{children}</BodyEl>

				{(closeAction || footer) && (
					<AdaptiveDialogFooter {...footerProps}>
						{closeAction && (
							<AdaptiveDialogClose {...closeProps}>
								{closeAction}
							</AdaptiveDialogClose>
						)}
						{footer}
					</AdaptiveDialogFooter>
				)}
			</AdaptiveDialogContent>
		</AdaptiveDialog>
	);
}
