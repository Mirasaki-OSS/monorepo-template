'use client';

import type { HTTPErrorResponse } from '@md-oss/common/http/types';
import {
	CodeBlock,
	type CodeBlockProps,
} from '@md-oss/design-system/components/ui/aceternity/code-block';
import { Checkbox } from '@md-oss/design-system/components/ui/checkbox';
import { Callout } from '@md-oss/design-system/components/ui/extended/callout';
import { mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import React from 'react';

const errorCodeFriendlyNames: Record<string, string> = {
	UNAUTHORIZED: 'You are not authorized',
	FORBIDDEN: 'You do not have permission',
	TOO_MANY_REQUESTS: 'You have exceeded your rate limit',
	INTERNAL_SERVER_ERROR: 'Internal server error',
	rest: 'Something went wrong',
};

export type HTTPErrorAlertProps = {
	error: HTTPErrorResponse;
	className?: string;
	classNames?: {
		callout?: string;
		message?: string;
		detailsToggle?: string;
		detailsLabel?: string;
		codeBlock?: string;
	};
	slotProps?: {
		callout?: Omit<
			React.ComponentProps<typeof Callout>,
			'variant' | 'title' | 'children'
		>;
		message?: React.HTMLAttributes<HTMLParagraphElement>;
		detailsToggle?: React.ComponentPropsWithoutRef<typeof Checkbox>;
		detailsLabel?: React.HTMLAttributes<HTMLSpanElement>;
		codeBlock?: Omit<CodeBlockProps, 'language' | 'code' | 'tabs' | 'title'>;
	};
};

export const HTTPErrorAlert = ({
	error,
	className,
	classNames,
	slotProps,
}: HTTPErrorAlertProps): React.JSX.Element | null => {
	const [isDismissed, setIsDismissed] = React.useState(false);
	const [showDetails, setShowDetails] = React.useState(false);

	const details = error.details || null;
	const title =
		errorCodeFriendlyNames[error.code] || errorCodeFriendlyNames.rest;

	const calloutProps = mergePropsWithClassName<
		Omit<React.ComponentProps<typeof Callout>, 'variant' | 'title' | 'children'>
	>(
		{
			className: 'my-2',

			handleClose() {
				setIsDismissed(true);
			},
		},
		slotProps?.callout,
		className,
		classNames?.callout
	);

	const messageProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLParagraphElement>
	>(
		{
			className: 'whitespace-pre-wrap mb-1!',
		},
		slotProps?.message,
		classNames?.message
	);

	const detailsToggleProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Checkbox>
	>({}, slotProps?.detailsToggle, classNames?.detailsToggle);

	const detailsLabelProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLSpanElement>
	>({}, slotProps?.detailsLabel, classNames?.detailsLabel);

	if (isDismissed) {
		return null;
	}

	return (
		<Callout {...calloutProps} variant="error" title={title}>
			<p {...messageProps}>
				[{error.statusCode}] {error.message}
			</p>
			{details && (
				<>
					<div className="inline-flex items-center gap-1">
						<Checkbox
							{...detailsToggleProps}
							checked={showDetails}
							onCheckedChange={(checked) => setShowDetails(!!checked)}
						></Checkbox>
						<span {...detailsLabelProps}>
							{showDetails ? 'Hide' : 'Show'} Details
						</span>
					</div>
					{showDetails && (
						<CodeBlock
							{...slotProps?.codeBlock}
							className={classNames?.codeBlock}
							language="json"
							code={JSON.stringify(details, null, 2)}
							title={
								<p className="flex items-center gap-1">
									<span className="size-2.5 bg-orange-400 rounded-full inline-flex" />
									JSON Details
								</p>
							}
						/>
					)}
				</>
			)}
		</Callout>
	);
};
