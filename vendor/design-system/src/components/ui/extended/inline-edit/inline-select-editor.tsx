'use client';

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@md-oss/design-system/components/ui/select';
import { Spinner } from '@md-oss/design-system/components/ui/spinner';
import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { PencilIcon } from 'lucide-react';
import React from 'react';
import { runHandlerAndContinue } from './shared';

export type InlineSelectOption = {
	label: React.ReactNode;
	value: string;
};

export type InlineSelectEditorProps = {
	value: string;
	options: InlineSelectOption[];
	onSave: (nextValue: string) => Promise<void> | void;
	editable?: boolean;
	disabled?: boolean;
	showEditIcon?: boolean;
	className?: string;
	placeholder?: string;
	renderValue?: (value: string) => React.ReactNode;
	onSaveError?: (error: unknown) => void;
	classNames?: {
		trigger?: string;
		icon?: string;
		selectTrigger?: string;
	};
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		trigger?: React.ButtonHTMLAttributes<HTMLButtonElement>;
		icon?: React.SVGAttributes<SVGElement>;
		select?: Omit<
			React.ComponentPropsWithoutRef<typeof Select>,
			'onValueChange' | 'value'
		>;
		selectTrigger?: Omit<
			React.ComponentPropsWithoutRef<typeof SelectTrigger>,
			'children'
		>;
		selectContent?: React.ComponentPropsWithoutRef<typeof SelectContent>;
		selectItem?: Omit<
			React.ComponentPropsWithoutRef<typeof SelectItem>,
			'value' | 'children'
		>;
	};
};

export function InlineSelectEditor({
	value,
	options,
	onSave,
	editable = true,
	disabled = false,
	showEditIcon = true,
	className,
	placeholder = 'Select value',
	renderValue,
	onSaveError,
	classNames,
	slotProps,
}: InlineSelectEditorProps): React.JSX.Element {
	const [isEditing, setIsEditing] = React.useState(false);
	const [isSaving, setIsSaving] = React.useState(false);

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
				'group/inline-select flex h-9 w-full items-center gap-2 rounded-md border border-transparent px-2.5 py-1.5 text-left text-sm transition-colors hover:border-border hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60',
		},
		slotProps?.trigger,
		classNames?.trigger
	);

	const iconProps = mergePropsWithClassName<React.SVGAttributes<SVGElement>>(
		{
			className:
				'size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/inline-select:opacity-80',
		},
		slotProps?.icon,
		classNames?.icon
	);

	const selectedOption = options.find((option) => option.value === value);

	const saveValue = React.useCallback(
		async (nextValue: string) => {
			setIsSaving(true);
			try {
				await onSave(nextValue);
				setIsEditing(false);
			} catch (error) {
				onSaveError?.(error);
			} finally {
				setIsSaving(false);
			}
		},
		[onSave, onSaveError]
	);

	if (!editable) {
		return (
			<ContainerEl {...containerProps}>
				<span className="text-sm">
					{renderValue ? renderValue(value) : value}
				</span>
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
					<span className="min-w-0 flex-1 truncate">
						{renderValue ? (
							renderValue(value)
						) : selectedOption ? (
							selectedOption.label
						) : (
							<span className="text-muted-foreground italic">
								{placeholder}
							</span>
						)}
					</span>
					{showEditIcon && <PencilIcon {...iconProps} />}
				</button>
			</ContainerEl>
		);
	}

	const selectProps = slotProps?.select;

	const selectTriggerProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof SelectTrigger>
	>(
		{
			className: 'w-full',
		},
		slotProps?.selectTrigger,
		classNames?.selectTrigger
	);

	const selectContentProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof SelectContent>
	>({}, slotProps?.selectContent);

	const { className: selectItemClassName, ...selectItemProps } =
		slotProps?.selectItem ?? {};

	return (
		<ContainerEl {...containerProps}>
			<Select
				{...selectProps}
				value={value}
				disabled={disabled || isSaving}
				onValueChange={(nextValue) => {
					void saveValue(nextValue);
				}}
			>
				<SelectTrigger {...selectTriggerProps}>
					<SelectValue placeholder={placeholder} />
					{isSaving && <Spinner className="ml-2 size-3.5" />}
				</SelectTrigger>
				<SelectContent {...selectContentProps}>
					{options.map((option) => (
						<SelectItem
							{...selectItemProps}
							className={selectItemClassName}
							key={option.value}
							value={option.value}
						>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</ContainerEl>
	);
}
