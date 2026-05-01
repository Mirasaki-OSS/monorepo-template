'use client';

import { Button } from '@md-oss/design-system/components/ui/button';
import { mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import { CheckIcon, CopyIcon, Loader2Icon } from 'lucide-react';
import React from 'react';

export type CopyButtonStatus = 'idle' | 'copying' | 'copied';

export async function copyToClipboard(text: string): Promise<void> {
	if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
		throw new Error('Clipboard API is unavailable in this environment.');
	}
	await navigator.clipboard.writeText(text);
}

type CopyTextSource =
	| {
			text: string;
			getText?: never;
	  }
	| {
			text?: never;
			getText: () => string | Promise<string>;
	  };

export type CopyButtonProps = CopyTextSource & {
	className?: string;
	disabled?: boolean;
	classNames?: {
		icon?: string;
		label?: string;
	};
	slotProps?: {
		button?: Omit<
			React.ComponentPropsWithoutRef<typeof Button>,
			'onClick' | 'children' | 'type'
		>;
		icon?: React.HTMLAttributes<HTMLSpanElement>;
		label?: React.HTMLAttributes<HTMLSpanElement>;
	};
	copiedDurationMs?: number;
	hideLabel?: boolean;
	idleLabel?: React.ReactNode;
	copyingLabel?: React.ReactNode;
	copiedLabel?: React.ReactNode;
	idleIcon?: React.ReactNode;
	copyingIcon?: React.ReactNode;
	copiedIcon?: React.ReactNode;
	onCopied?: (copiedText: string) => void;
	onCopyError?: (error: unknown) => void;
};

export const CopyButton = ({
	text,
	getText,
	className,
	disabled,
	classNames,
	slotProps,
	copiedDurationMs = 2000,
	hideLabel = false,
	idleLabel = 'Copy',
	copyingLabel = 'Copying...',
	copiedLabel = 'Copied',
	idleIcon,
	copyingIcon,
	copiedIcon,
	onCopied,
	onCopyError,
}: CopyButtonProps): React.JSX.Element => {
	const [status, setStatus] = React.useState<CopyButtonStatus>('idle');
	const resetTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
		null
	);

	React.useEffect(() => {
		return () => {
			if (resetTimeoutRef.current) {
				clearTimeout(resetTimeoutRef.current);
			}
		};
	}, []);

	const buttonProps = mergePropsWithClassName<
		Omit<
			React.ComponentPropsWithoutRef<typeof Button>,
			'onClick' | 'children' | 'type'
		>
	>(
		{
			variant: 'ghost',
			size: 'icon-sm',
			className:
				'font-sans text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200',
		},
		slotProps?.button,
		className
	);

	const iconProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLSpanElement>
	>(
		{ className: 'inline-flex items-center justify-center' },
		slotProps?.icon,
		classNames?.icon
	);

	const labelProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLSpanElement>
	>({ className: 'text-xs' }, slotProps?.label, classNames?.label);

	const currentIcon =
		status === 'copying'
			? (copyingIcon ?? <Loader2Icon className="size-3 animate-spin" />)
			: status === 'copied'
				? (copiedIcon ?? <CheckIcon className="size-3" />)
				: (idleIcon ?? <CopyIcon className="size-3" />);

	const currentLabel =
		status === 'copying'
			? copyingLabel
			: status === 'copied'
				? copiedLabel
				: idleLabel;

	const handleClick = async (): Promise<void> => {
		try {
			setStatus('copying');
			const textToCopy = getText ? await getText() : text;
			const normalizedText = textToCopy ?? '';
			await copyToClipboard(normalizedText);
			onCopied?.(normalizedText);
			setStatus('copied');

			if (resetTimeoutRef.current) {
				clearTimeout(resetTimeoutRef.current);
			}
			resetTimeoutRef.current = setTimeout(() => {
				setStatus('idle');
			}, copiedDurationMs);
		} catch (error) {
			setStatus('idle');
			onCopyError?.(error);
		}
	};

	const isDisabled = disabled || buttonProps.disabled || status === 'copying';
	const ariaLabel =
		buttonProps['aria-label'] ||
		(typeof currentLabel === 'string' ? currentLabel : 'Copy to clipboard');

	return (
		<Button
			{...buttonProps}
			type="button"
			onClick={handleClick}
			disabled={isDisabled}
			aria-label={ariaLabel}
		>
			<span {...iconProps}>{currentIcon}</span>
			{!hideLabel && <span {...labelProps}>{currentLabel}</span>}
		</Button>
	);
};
