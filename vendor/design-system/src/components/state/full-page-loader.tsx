'use client';

import {
	Loader,
	type LoaderProps,
} from '@md-oss/design-system/components/state/loader';
import { mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import type React from 'react';
import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export type FullPageLoaderProps = {
	description?: string;
	className?: string;
	classNames?: {
		wrapper?: string;
		content?: string;
		description?: string;
	};
	slotProps?: {
		wrapper?: React.HTMLAttributes<HTMLDivElement>;
		content?: React.HTMLAttributes<HTMLDivElement>;
		loader?: LoaderProps;
		description?: React.HTMLAttributes<HTMLSpanElement>;
	};
};

export function FullPageLoader({
	description = 'Loading...',
	className,
	classNames,
	slotProps,
}: FullPageLoaderProps): React.ReactPortal | null {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	if (!isClient) return null;

	const wrapperProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				'fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out',
		},
		slotProps?.wrapper,
		className,
		classNames?.wrapper
	);

	const contentProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{ className: 'flex flex-col items-center gap-2' },
		slotProps?.content,
		classNames?.content
	);

	const descriptionProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLSpanElement>
	>(
		{ className: 'text-sm text-muted-foreground' },
		slotProps?.description,
		classNames?.description
	);

	return ReactDOM.createPortal(
		<div {...wrapperProps}>
			<div {...contentProps}>
				<Loader size="lg" {...slotProps?.loader} />
				{description && <span {...descriptionProps}>{description}</span>}
			</div>
		</div>,
		document.body
	);
}
