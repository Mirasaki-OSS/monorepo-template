'use client';

import { Button } from '@md-oss/design-system/components/ui/button';
import { Input } from '@md-oss/design-system/components/ui/input';
import { Spinner } from '@md-oss/design-system/components/ui/spinner';
import { Textarea } from '@md-oss/design-system/components/ui/textarea';
import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { CheckIcon, PencilIcon, XIcon } from 'lucide-react';
import React from 'react';
import {
	type InlineEditorMode,
	runHandlerAndContinue,
	useInlineSaveState,
} from './shared';

export type InlineTextEditorProps = {
	value: string;
	onSave: (nextValue: string) => Promise<void> | void;
	mode?: InlineEditorMode;
	editable?: boolean;
	disabled?: boolean;
	showEditIcon?: boolean;
	className?: string;
	placeholders?: {
		idle?: string;
		editing?: string;
	};
	renderValue?: (value: string) => React.ReactNode;
	onSaveError?: (error: unknown) => void;
	classNames?: {
		trigger?: string;
		value?: string;
		input?: string;
		textarea?: string;
		actions?: string;
		icon?: string;
	};
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		trigger?: React.ButtonHTMLAttributes<HTMLButtonElement>;
		value?: React.HTMLAttributes<HTMLSpanElement>;
		input?: Omit<
			React.ComponentPropsWithoutRef<typeof Input>,
			'value' | 'onChange'
		>;
		textarea?: Omit<
			React.ComponentPropsWithoutRef<typeof Textarea>,
			'value' | 'onChange'
		>;
		actions?: React.HTMLAttributes<HTMLDivElement>;
		saveButton?: Omit<
			React.ComponentPropsWithoutRef<typeof Button>,
			'onClick' | 'children' | 'disabled' | 'type'
		>;
		cancelButton?: Omit<
			React.ComponentPropsWithoutRef<typeof Button>,
			'onClick' | 'children' | 'type'
		>;
		icon?: React.SVGAttributes<SVGElement>;
	};
};

export function InlineTextEditor({
	value,
	onSave,
	mode = 'single-line',
	editable = true,
	disabled = false,
	showEditIcon = true,
	className,
	placeholders,
	renderValue,
	onSaveError,
	classNames,
	slotProps,
}: InlineTextEditorProps): React.JSX.Element {
	const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement | null>(
		null
	);
	const { draft, isEditing, isSaving, setDraft, setIsEditing, setIsSaving } =
		useInlineSaveState(value);

	React.useEffect(() => {
		if (!isEditing) {
			return;
		}

		inputRef.current?.focus();
		if (mode === 'single-line') {
			const cursorPosition = inputRef.current?.value.length ?? 0;
			inputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
		}
	}, [isEditing, mode]);

	const saveDraft = React.useCallback(async () => {
		setIsSaving(true);
		try {
			await onSave(draft);
			setIsEditing(false);
		} catch (error) {
			onSaveError?.(error);
		} finally {
			setIsSaving(false);
		}
	}, [draft, onSave, onSaveError, setIsEditing, setIsSaving]);

	const cancelEdit = React.useCallback(() => {
		setDraft(value);
		setIsEditing(false);
	}, [setDraft, setIsEditing, value]);

	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: 'relative min-h-9 w-full min-w-0',
		},
		containerSlotProps,
		className
	);

	const triggerProps = mergePropsWithClassName<
		React.ButtonHTMLAttributes<HTMLButtonElement>
	>(
		{
			type: 'button',
			disabled: disabled,
			className:
				'group/inline-trigger flex w-full items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-left text-sm transition-colors hover:border-border hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60',
		},
		slotProps?.trigger,
		classNames?.trigger
	);

	const valueProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLSpanElement>
	>(
		{
			className: 'min-w-0 flex-1 truncate',
		},
		slotProps?.value,
		classNames?.value
	);

	const iconProps = mergePropsWithClassName<React.SVGAttributes<SVGElement>>(
		{
			className:
				'size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/inline-trigger:opacity-80',
		},
		slotProps?.icon,
		classNames?.icon
	);

	const actionsProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				'absolute top-1/2 right-1 z-10 flex -translate-y-1/2 items-center gap-1 rounded-md bg-background/95 p-0.5 backdrop-blur-sm',
		},
		slotProps?.actions,
		classNames?.actions
	);

	const saveButtonProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Button>
	>({ size: 'icon-xs', variant: 'default' }, slotProps?.saveButton);

	const cancelButtonProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Button>
	>({ size: 'icon-xs', variant: 'ghost' }, slotProps?.cancelButton);

	if (!editable) {
		return (
			<ContainerEl {...containerProps}>
				<span {...valueProps}>{renderValue ? renderValue(value) : value}</span>
			</ContainerEl>
		);
	}

	if (!isEditing) {
		return (
			<ContainerEl {...containerProps}>
				<button
					{...triggerProps}
					onClick={(event) => {
						runHandlerAndContinue(event, triggerProps.onClick, () => {
							setIsEditing(true);
						});
					}}
				>
					<span {...valueProps}>
						{renderValue ? (
							renderValue(value)
						) : value ? (
							value
						) : (
							<span className="text-muted-foreground italic">
								{placeholders?.idle ?? 'Click to edit'}
							</span>
						)}
					</span>
					{showEditIcon && <PencilIcon {...iconProps} />}
				</button>
			</ContainerEl>
		);
	}

	const inputProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Input>
	>(
		{
			className: 'pr-20',
			placeholder: placeholders?.editing ?? 'Enter value',
		},
		slotProps?.input,
		classNames?.input
	);

	const textareaProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Textarea>
	>(
		{
			className: 'min-h-24 pr-20',
			placeholder: placeholders?.editing ?? 'Enter value',
		},
		slotProps?.textarea,
		classNames?.textarea
	);

	return (
		<ContainerEl {...containerProps}>
			{mode === 'multiline' ? (
				<Textarea
					{...textareaProps}
					ref={inputRef as React.RefObject<HTMLTextAreaElement>}
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={(event) => {
						textareaProps.onKeyDown?.(event);
						if (event.defaultPrevented) return;
						if (event.key === 'Escape') {
							event.preventDefault();
							cancelEdit();
						}
						if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
							event.preventDefault();
							void saveDraft();
						}
					}}
				/>
			) : (
				<Input
					{...inputProps}
					ref={inputRef as React.RefObject<HTMLInputElement>}
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					onKeyDown={(event) => {
						inputProps.onKeyDown?.(event);
						if (event.defaultPrevented) return;
						if (event.key === 'Escape') {
							event.preventDefault();
							cancelEdit();
						}
						if (event.key === 'Enter') {
							event.preventDefault();
							void saveDraft();
						}
					}}
				/>
			)}
			<div {...actionsProps}>
				<Button
					{...saveButtonProps}
					type="button"
					disabled={disabled || isSaving}
					onClick={(event) => {
						runHandlerAndContinue(event, saveButtonProps.onClick, () => {
							void saveDraft();
						});
					}}
				>
					{isSaving ? <Spinner /> : <CheckIcon />}
				</Button>
				<Button
					{...cancelButtonProps}
					type="button"
					onClick={(event) => {
						runHandlerAndContinue(event, cancelButtonProps.onClick, () => {
							cancelEdit();
						});
					}}
				>
					<XIcon />
				</Button>
			</div>
		</ContainerEl>
	);
}
