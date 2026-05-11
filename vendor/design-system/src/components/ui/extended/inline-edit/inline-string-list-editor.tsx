'use client';

import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	rectSortingStrategy,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from '@md-oss/design-system/components/ui/badge';
import { Button } from '@md-oss/design-system/components/ui/button';
import { Input } from '@md-oss/design-system/components/ui/input';
import { Textarea } from '@md-oss/design-system/components/ui/textarea';
import {
	appendStableOrderId,
	ensureStableOrderIds,
	removeStableOrderIdAt,
	reorderByStableIds,
} from '@md-oss/design-system/lib/dnd';
import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { GripVerticalIcon, PlusIcon, XIcon } from 'lucide-react';
import React from 'react';
import { type InlineEditorMode, runHandlerAndContinue } from './shared';

type InlineStringListMode = 'chips' | 'list';

export type InlineStringListEditorProps = {
	value: string[];
	onChange: (nextValue: string[]) => void;
	editable?: boolean;
	reorderable?: boolean;
	mode?: InlineStringListMode;
	composerMode?: InlineEditorMode;
	placeholder?: string;
	className?: string;
	classNames?: {
		list?: string;
		item?: string;
		dragHandle?: string;
		composer?: string;
	};
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		list?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		item?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		dragHandleButton?: Omit<
			React.ComponentPropsWithoutRef<typeof Button>,
			'onClick' | 'children' | 'type'
		>;
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
	reorderable = true,
	mode = 'chips',
	composerMode = 'single-line',
	placeholder = 'Add item...',
	className,
	classNames,
	slotProps,
}: InlineStringListEditorProps): React.JSX.Element {
	const [inputValue, setInputValue] = React.useState('');
	const dndContextId = React.useId();
	const stableIdsRef = React.useRef<string[]>([]);
	const stableIds = ensureStableOrderIds(
		stableIdsRef.current,
		value.length,
		'str'
	);
	stableIdsRef.current = stableIds;
	const isReorderEnabled = editable && reorderable && value.length > 1;
	const sortingStrategy =
		mode === 'chips' ? rectSortingStrategy : verticalListSortingStrategy;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

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

	const dragHandleButtonProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof Button>
	>(
		{
			type: 'button',
			size: 'icon-xs',
			variant: 'ghost',
			className:
				'-ml-1 cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing',
		},
		slotProps?.dragHandleButton,
		classNames?.dragHandle
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

		stableIdsRef.current = appendStableOrderId(stableIds, 'str');
		onChange([...value, nextItem]);
		setInputValue('');
	}, [inputValue, onChange, stableIds, value]);

	const removeItem = React.useCallback(
		(index: number) => {
			stableIdsRef.current = removeStableOrderIdAt(stableIds, index);
			onChange(value.filter((_, currentIndex) => currentIndex !== index));
		},
		[onChange, stableIds, value]
	);

	const handleDragEnd = React.useCallback(
		({ active, over }: DragEndEvent) => {
			if (!over) {
				return;
			}

			const nextOrder = reorderByStableIds({
				ids: stableIds,
				items: value,
				activeId: String(active.id),
				overId: String(over.id),
			});
			if (!nextOrder) {
				return;
			}

			stableIdsRef.current = nextOrder.nextIds;
			onChange(nextOrder.nextItems);
		},
		[onChange, stableIds, value]
	);

	const renderListItem = React.useCallback(
		(
			item: string,
			index: number,
			dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>
		) => {
			const dragHandleButton = dragHandleProps ? (
				<Button
					{...dragHandleButtonProps}
					aria-label={`Drag to reorder ${item}`}
					disabled={dragHandleButtonProps.disabled}
					{...dragHandleProps}
				>
					<GripVerticalIcon />
				</Button>
			) : null;

			return (
				<ItemEl {...itemProps}>
					{mode === 'chips' ? (
						<Badge variant="secondary" size="sm" className="gap-1">
							{dragHandleButton}
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
							<div className="flex min-w-0 items-center gap-1.5">
								{dragHandleButton}
								<span className="truncate">{item}</span>
							</div>
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
			);
		},
		[
			ItemEl,
			dragHandleButtonProps,
			editable,
			itemProps,
			mode,
			removeButtonProps,
			removeItem,
		]
	);

	return (
		<ContainerEl {...containerProps}>
			{isReorderEnabled ? (
				<DndContext
					id={dndContextId}
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext items={stableIds} strategy={sortingStrategy}>
						<ListEl {...listProps}>
							{stableIds.map((stableId, index) => {
								const item = value[index];
								if (typeof item !== 'string') {
									return null;
								}
								return (
									<SortableInlineStringItem
										key={stableId}
										id={stableId}
										disabled={!isReorderEnabled}
									>
										{(dragHandleProps) =>
											renderListItem(item, index, dragHandleProps)
										}
									</SortableInlineStringItem>
								);
							})}
						</ListEl>
					</SortableContext>
				</DndContext>
			) : (
				<ListEl {...listProps}>
					{value.map((item, index) => (
						<React.Fragment key={`${item}-${index}`}>
							{renderListItem(item, index)}
						</React.Fragment>
					))}
				</ListEl>
			)}

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

const SortableInlineStringItem = ({
	id,
	disabled,
	children,
}: {
	id: string;
	disabled?: boolean;
	children: (
		dragHandleProps: React.HTMLAttributes<HTMLButtonElement>
	) => React.ReactNode;
}) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id, disabled });

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={isDragging ? 'opacity-50' : undefined}
		>
			{children({ ...attributes, ...listeners })}
		</div>
	);
};
