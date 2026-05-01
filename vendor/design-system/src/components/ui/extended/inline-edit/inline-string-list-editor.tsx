'use client';

import { Badge } from '@md-oss/design-system/components/ui/badge';
import { Button } from '@md-oss/design-system/components/ui/button';
import { Input } from '@md-oss/design-system/components/ui/input';
import { Textarea } from '@md-oss/design-system/components/ui/textarea';
import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { PlusIcon, XIcon } from 'lucide-react';
import React from 'react';
import { type InlineEditorMode, runHandlerAndContinue } from './shared';

type InlineStringListMode = 'chips' | 'list';

export type InlineStringListEditorProps = {
	value: string[];
	onChange: (nextValue: string[]) => void;
	editable?: boolean;
	mode?: InlineStringListMode;
	composerMode?: InlineEditorMode;
	placeholder?: string;
	className?: string;
	classNames?: {
		list?: string;
		item?: string;
		composer?: string;
	};
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		list?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		item?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		removeButton?: Omit<
			React.ComponentPropsWithoutRef<typeof Button>,
			'onClick' | 'children' | 'type'
		>;
		composer?: React.HTMLAttributes<HTMLDivElement>;
		input?: Omit<
			React.ComponentPropsWithoutRef<typeof Input>,
			'value' | 'onChange'
		>;
		textarea?: Omit<
			React.ComponentPropsWithoutRef<typeof Textarea>,
			'value' | 'onChange'
		>;
		addButton?: Omit<
			React.ComponentPropsWithoutRef<typeof Button>,
			'onClick' | 'children' | 'type' | 'disabled'
		>;
	};
};

export function InlineStringListEditor({
	value,
	onChange,
	editable = true,
	mode = 'chips',
	composerMode = 'single-line',
	placeholder = 'Add item...',
	className,
	classNames,
	slotProps,
}: InlineStringListEditorProps): React.JSX.Element {
	const [inputValue, setInputValue] = React.useState('');

	const [ContainerEl, containerSlotProps] = resolveSlot(
		'div',
		slotProps?.container
	);
	const [ListEl, listSlotProps] = resolveSlot('div', slotProps?.list);
	const [ItemEl, itemSlotProps] = resolveSlot('div', slotProps?.item);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: 'w-full space-y-2',
		},
		containerSlotProps,
		className
	);

	const listProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				mode === 'chips' ? 'flex flex-wrap gap-2' : 'flex flex-col gap-1.5',
		},
		listSlotProps,
		classNames?.list
	);

	const itemProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				mode === 'chips'
					? 'inline-flex items-center'
					: 'flex items-center justify-between rounded-md border border-border/60 bg-muted/20 px-3 py-1.5 text-sm',
		},
		itemSlotProps,
		classNames?.item
	);

	const removeButtonProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Button>
	>(
		{ size: 'icon-xs', variant: 'ghost', className: 'ml-1' },
		slotProps?.removeButton
	);

	const composerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className:
				composerMode === 'multiline'
					? 'flex flex-col gap-2'
					: 'flex items-center gap-2',
		},
		slotProps?.composer,
		classNames?.composer
	);

	const inputProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Input>
	>(
		{
			placeholder,
		},
		slotProps?.input
	);

	const textareaProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Textarea>
	>(
		{
			placeholder,
			className: 'min-h-20',
		},
		slotProps?.textarea
	);

	const addButtonProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Button>
	>(
		{
			type: 'button',
			variant: 'secondary',
			size: composerMode === 'multiline' ? 'sm' : 'default',
		},
		slotProps?.addButton
	);

	const appendItem = React.useCallback(() => {
		const nextItem = inputValue.trim();
		if (!nextItem || value.includes(nextItem)) {
			return;
		}

		onChange([...value, nextItem]);
		setInputValue('');
	}, [inputValue, onChange, value]);

	const removeItem = React.useCallback(
		(index: number) => {
			onChange(value.filter((_, currentIndex) => currentIndex !== index));
		},
		[onChange, value]
	);

	return (
		<ContainerEl {...containerProps}>
			<ListEl {...listProps}>
				{value.map((item, index) => (
					<ItemEl {...itemProps} key={`${item}-${index}`}>
						{mode === 'chips' ? (
							<Badge variant="secondary" size="sm" className="gap-1">
								{item}
								{editable && (
									<Button
										{...removeButtonProps}
										type="button"
										onClick={(event) => {
											runHandlerAndContinue(
												event,
												removeButtonProps.onClick,
												() => {
													removeItem(index);
												}
											);
										}}
									>
										<XIcon />
									</Button>
								)}
							</Badge>
						) : (
							<>
								<span className="truncate">{item}</span>
								{editable && (
									<Button
										{...removeButtonProps}
										type="button"
										onClick={(event) => {
											runHandlerAndContinue(
												event,
												removeButtonProps.onClick,
												() => {
													removeItem(index);
												}
											);
										}}
									>
										<XIcon />
									</Button>
								)}
							</>
						)}
					</ItemEl>
				))}
			</ListEl>

			{editable && (
				<div {...composerProps}>
					{composerMode === 'multiline' ? (
						<Textarea
							{...textareaProps}
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
							onKeyDown={(event) => {
								textareaProps.onKeyDown?.(event);
								if (event.defaultPrevented) return;
								if (
									event.key === 'Enter' &&
									!(event.shiftKey || event.metaKey || event.ctrlKey)
								) {
									event.preventDefault();
									appendItem();
								}
							}}
						/>
					) : (
						<Input
							{...inputProps}
							value={inputValue}
							onChange={(event) => setInputValue(event.target.value)}
							onKeyDown={(event) => {
								inputProps.onKeyDown?.(event);
								if (event.defaultPrevented) return;
								if (event.key === 'Enter') {
									event.preventDefault();
									appendItem();
								}
							}}
						/>
					)}
					<Button
						{...addButtonProps}
						disabled={!inputValue.trim() || value.includes(inputValue.trim())}
						onClick={(event) => {
							runHandlerAndContinue(event, addButtonProps.onClick, () => {
								appendItem();
							});
						}}
					>
						{composerMode === 'multiline' ? <PlusIcon /> : 'Add'}
					</Button>
				</div>
			)}
		</ContainerEl>
	);
}
