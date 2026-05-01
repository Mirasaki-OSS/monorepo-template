'use client';

import {
	Loader,
	type LoaderProps,
} from '@md-oss/design-system/components/state/loader';
import { mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import type React from 'react';

// --- LoadingOverlay ---

export type LoadingOverlayProps = {
	isLoading: boolean;
	message?: string;
	className?: string;
	classNames?: {
		wrapper?: string;
		content?: string;
		message?: string;
	};
	slotProps?: {
		wrapper?: React.HTMLAttributes<HTMLDivElement>;
		content?: React.HTMLAttributes<HTMLDivElement>;
		loader?: LoaderProps;
		message?: React.HTMLAttributes<HTMLParagraphElement>;
	};
};

export function LoadingOverlay({
	isLoading,
	message = 'Loading...',
	className,
	classNames,
	slotProps,
}: LoadingOverlayProps): React.JSX.Element | null {
	if (!isLoading) return null;

	const wrapperProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in-0 duration-300',
		},
		slotProps?.wrapper,
		className,
		classNames?.wrapper
	);

	const contentProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				'flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 delay-100',
		},
		slotProps?.content,
		classNames?.content
	);

	const messageProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLParagraphElement>
	>(
		{ className: 'text-sm text-muted-foreground animate-pulse' },
		slotProps?.message,
		classNames?.message
	);

	return (
		<div {...wrapperProps}>
			<div {...contentProps}>
				<Loader size="lg" variant="default" {...slotProps?.loader} />
				{message && <p {...messageProps}>{message}</p>}
			</div>
		</div>
	);
}

// --- ProgressBar ---

export type ProgressBarProps = {
	progress: number;
	className?: string;
	classNames?: {
		track?: string;
		fill?: string;
	};
	slotProps?: {
		track?: React.HTMLAttributes<HTMLDivElement>;
		fill?: React.HTMLAttributes<HTMLDivElement>;
	};
};

export function ProgressBar({
	progress,
	className,
	classNames,
	slotProps,
}: ProgressBarProps): React.JSX.Element {
	const clampedProgress = Math.min(Math.max(progress, 0), 100);

	const trackProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				'fixed top-0 left-0 right-0 h-1 bg-muted z-50 animate-in slide-in-from-top-2 duration-200',
		},
		slotProps?.track,
		className,
		classNames?.track
	);

	const fillProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: 'h-full bg-primary transition-all duration-300 ease-out',
			style: { width: `${clampedProgress}%` },
		},
		slotProps?.fill,
		classNames?.fill
	);

	return (
		<div {...trackProps}>
			<div {...fillProps} />
		</div>
	);
}
