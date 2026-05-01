'use client';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@md-oss/design-system/components/ui/alert-dialog';
import { buttonVariants } from '@md-oss/design-system/components/ui/button';
import { useConfirmationStore } from '@md-oss/design-system/hooks/use-confirmation-store';
import { cn, mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import type React from 'react';

export type ConfirmationDialogProps = {
	className?: string;
	classNames?: {
		content?: string;
		header?: string;
		title?: string;
		description?: string;
		footer?: string;
		cancelButton?: string;
		actionButton?: string;
	};
	slotProps?: {
		content?: React.ComponentPropsWithoutRef<typeof AlertDialogContent>;
		header?: React.ComponentPropsWithoutRef<typeof AlertDialogHeader>;
		title?: React.ComponentPropsWithoutRef<typeof AlertDialogTitle>;
		description?: React.ComponentPropsWithoutRef<typeof AlertDialogDescription>;
		footer?: React.ComponentPropsWithoutRef<typeof AlertDialogFooter>;
	};
};

export function ConfirmationDialog({
	className,
	classNames,
	slotProps,
}: ConfirmationDialogProps = {}): React.JSX.Element {
	const {
		open,
		title,
		description,
		children,
		cancelLabel,
		actionLabel,
		actionProps = {},
		cancelProps = {},
		onAction,
		closeConfirmation,
	} = useConfirmationStore();

	const {
		className: actionClassName,
		variant: actionVariant,
		...actionRest
	} = actionProps;
	const {
		className: cancelClassName,
		variant: cancelVariant,
		...cancelRest
	} = cancelProps;

	const contentProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof AlertDialogContent>
	>({}, slotProps?.content, className, classNames?.content);

	const headerProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof AlertDialogHeader>
	>({}, slotProps?.header, classNames?.header);

	const titleProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof AlertDialogTitle>
	>({}, slotProps?.title, classNames?.title);

	const descriptionProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof AlertDialogDescription>
	>({}, slotProps?.description, classNames?.description);

	const footerProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof AlertDialogFooter>
	>({}, slotProps?.footer, classNames?.footer);

	return (
		<AlertDialog open={open} onOpenChange={closeConfirmation}>
			<AlertDialogContent {...contentProps}>
				<AlertDialogHeader {...headerProps}>
					<AlertDialogTitle {...titleProps}>{title}</AlertDialogTitle>
					<AlertDialogDescription {...descriptionProps}>
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>

				{children}

				<AlertDialogFooter {...footerProps}>
					<AlertDialogCancel
						className={cn(
							buttonVariants({ variant: cancelVariant }),
							cancelClassName,
							classNames?.cancelButton
						)}
						{...cancelRest}
					>
						{cancelLabel}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onAction}
						className={cn(
							buttonVariants({ variant: actionVariant }),
							actionClassName,
							classNames?.actionButton
						)}
						{...actionRest}
					>
						{actionLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
