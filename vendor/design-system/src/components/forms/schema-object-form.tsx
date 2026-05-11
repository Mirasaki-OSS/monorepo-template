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
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	getEnumOptions,
	getFieldError,
	getSchemaDescription,
	isStringLikeSchema,
	unwrapSchema,
} from '@md-oss/common/schemas/schema-object-form';
import { ObjectUtils } from '@md-oss/common/utils';
import { Badge } from '@md-oss/design-system/components/ui/badge';
import { Button } from '@md-oss/design-system/components/ui/button';
import { InlineStringListEditor } from '@md-oss/design-system/components/ui/extended/inline-edit';
import { Input } from '@md-oss/design-system/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@md-oss/design-system/components/ui/select';
import {
	appendStableOrderId,
	ensureStableOrderIds,
	removeStableOrderIdAt,
	reorderByStableIds,
} from '@md-oss/design-system/lib/dnd';
import { cn, mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import {
	ChevronDownIcon,
	ChevronUpIcon,
	EyeIcon,
	EyeOffIcon,
	GripVerticalIcon,
	PlusIcon,
	XIcon,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useId, useMemo, useRef, useState } from 'react';
import z from 'zod/v4';

type SchemaObjectFormClassNames = {
	container?: string;
	rootError?: string;
	unsupportedSchema?: string;
	fieldError?: string;
};

export type SchemaObjectFormProps = {
	schema: z.ZodTypeAny;
	value: Record<string, unknown>;
	onChange: (next: Record<string, unknown>) => void;
	disabled?: boolean;
	errors?: Record<string, string>;
	formatKeys?: boolean;
	keyFormatter?: (key: string) => string;
	sensitiveFieldPaths?: readonly string[];
	className?: string;
	classNames?: SchemaObjectFormClassNames;
	slotProps?: {
		container?: React.HTMLAttributes<HTMLDivElement>;
		rootError?: React.HTMLAttributes<HTMLParagraphElement>;
		unsupportedSchema?: React.HTMLAttributes<HTMLParagraphElement>;
	};
};

const objectInlineActionClass = (type: 'add' | 'remove') =>
	cn(
		'group',
		'h-auto self-stretch rounded-md border border-border/70 px-2 text-xs transition-colors',
		'inline-flex items-center gap-1.5 whitespace-nowrap',
		'bg-muted/20 hover:bg-muted/35',
		type === 'add'
			? 'flex-col text-foreground/70 hover:text-foreground'
			: 'flex-row text-destructive/80 hover:text-destructive'
	);

const ObjectTileActionIcon = ({ type }: { type: 'add' | 'remove' }) => {
	const className = cn(
		'mx-auto h-4 w-4 shrink-0 transition-colors',
		type === 'add'
			? 'text-foreground/70 group-hover:text-foreground'
			: 'text-destructive/80 group-hover:text-destructive'
	);
	const IconComponent = type === 'add' ? PlusIcon : XIcon;

	return <IconComponent className={className} />;
};

const ObjectTileAction = ({
	type,
	onClick,
	disabled,
	className,
}: {
	type: 'add' | 'remove';
	onClick: () => void;
	disabled?: boolean;
	className?: string;
}) => {
	return (
		<Button
			type="button"
			variant="outline"
			disabled={disabled}
			onClick={onClick}
			className={cn(objectInlineActionClass(type), 'py-1.5', className)}
		>
			<ObjectTileActionIcon type={type} />
			{type === 'add' && <span>Add</span>}
		</Button>
	);
};

export const getObjectGroupClass = (depth: number): string => {
	if (depth === 0) {
		return 'space-y-3 rounded-md border border-border p-3';
	}

	if (depth === 1) {
		return 'space-y-3 rounded-md border border-border/60 p-3';
	}

	return 'space-y-3 rounded-md border border-border/40 p-3';
};

const getObjectFieldStackClass = (_depth: number) => {
	return 'space-y-2';
};

const getGroupTitleClass = (depth: number) => {
	if (depth === 0) {
		return 'text-xs font-semibold';
	}

	return 'text-xs font-medium';
};

const renderFieldError = (
	error: string | undefined,
	classNames?: SchemaObjectFormClassNames
) => {
	if (!error) {
		return null;
	}

	return (
		<p className={cn('text-xs text-red-600', classNames?.fieldError)}>
			{error}
		</p>
	);
};

const SortableArrayItemWrapper = ({
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

type SortableCollectionFieldProps<TItem> = {
	path: string[];
	label: string;
	singleLabel: string;
	description?: string | null;
	items: TItem[];
	isOptional: boolean;
	isNullable: boolean;
	depth: number;
	disabled?: boolean;
	fieldError?: string | null;
	onChangeValue: (value: unknown) => void;
	createItem: () => TItem;
	isObjectExpanded: (path: string[]) => boolean;
	toggleObjectExpanded: (path: string[]) => void;
	setObjectExpanded: (path: string[], expanded: boolean) => void;
	renderItem: (index: number) => React.ReactNode;
	classNames?: SchemaObjectFormClassNames;
};

const SortableCollectionField = <TItem,>({
	path,
	label,
	singleLabel,
	description,
	items,
	isOptional,
	isNullable,
	depth,
	disabled,
	fieldError,
	onChangeValue,
	createItem,
	isObjectExpanded,
	toggleObjectExpanded,
	setObjectExpanded,
	renderItem,
	classNames,
}: SortableCollectionFieldProps<TItem>) => {
	const dndContextId = useId();
	const stableIdsRef = useRef<string[]>([]);
	const stableIds = ensureStableOrderIds(stableIdsRef.current, items.length);
	stableIdsRef.current = stableIds;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	const isRemovableArray = isOptional || isNullable;
	const isExpanded = isObjectExpanded(path);

	const handleAddItem = () => {
		const nextItem = createItem();
		const nextIndex = items.length;
		stableIdsRef.current = appendStableOrderId(stableIds);
		setObjectExpanded(path, true);
		setObjectExpanded([...path, String(nextIndex)], true);
		onChangeValue([...items, nextItem]);
	};

	const handleRemoveItem = (index: number) => {
		stableIdsRef.current = removeStableOrderIdAt(stableIds, index);
		const nextItems = items.filter((_, i) => i !== index);
		onChangeValue(
			nextItems.length === 0
				? isRemovableArray
					? isOptional
						? undefined
						: null
					: []
				: nextItems
		);
	};

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over) return;
		const nextOrder = reorderByStableIds({
			ids: stableIds,
			items,
			activeId: String(active.id),
			overId: String(over.id),
		});
		if (!nextOrder) return;
		stableIdsRef.current = nextOrder.nextIds;
		onChangeValue(nextOrder.nextItems);
	};

	if (isRemovableArray && items.length === 0) {
		return (
			<div className={getObjectGroupClass(depth)}>
				<div className="flex items-center gap-2">
					<ObjectTileAction
						type="add"
						disabled={disabled}
						onClick={handleAddItem}
					/>
					<div className="min-w-0">
						<span className={getGroupTitleClass(depth)}>{label}</span>
						{description ? (
							<p className="text-xs text-muted-foreground">{description}</p>
						) : null}
					</div>
				</div>
				{renderFieldError(fieldError ?? undefined, classNames)}
			</div>
		);
	}

	return (
		<div className={getObjectGroupClass(depth)}>
			<div className="flex items-stretch gap-2">
				<button
					type="button"
					onClick={() => toggleObjectExpanded(path)}
					className="flex min-w-0 flex-1 items-center gap-2 text-left"
					aria-expanded={isExpanded}
				>
					{isExpanded ? (
						<ChevronUpIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					) : (
						<ChevronDownIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
					)}
					<span className="min-w-0">
						<span className={getGroupTitleClass(depth)}>{label}</span>
						{description ? (
							<p className="text-xs text-muted-foreground">{description}</p>
						) : null}
					</span>
				</button>
				<ObjectTileAction
					type="add"
					disabled={disabled}
					onClick={handleAddItem}
				/>
			</div>
			{isExpanded ? (
				<DndContext
					id={dndContextId}
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={stableIds}
						strategy={verticalListSortingStrategy}
					>
						<div className={getObjectFieldStackClass(depth)}>
							{stableIds.map((stableId, index) => {
								const itemPath = [...path, String(index)];
								const isItemExpanded = isObjectExpanded(itemPath);

								return (
									<SortableArrayItemWrapper
										key={stableId}
										id={stableId}
										disabled={disabled}
									>
										{(dragHandleProps) => (
											<div className={getObjectGroupClass(depth + 1)}>
												<div className="flex items-stretch gap-2">
													<button
														type="button"
														aria-label={`Drag to reorder ${singleLabel} ${index + 1}`}
														className="cursor-grab touch-none text-muted-foreground transition-colors hover:text-foreground active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
														disabled={disabled}
														{...dragHandleProps}
													>
														<GripVerticalIcon className="h-4 w-4" />
													</button>
													<button
														type="button"
														onClick={() => toggleObjectExpanded(itemPath)}
														className="flex min-w-0 flex-1 items-center gap-2 text-left"
														aria-expanded={isItemExpanded}
													>
														{isItemExpanded ? (
															<ChevronUpIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
														) : (
															<ChevronDownIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
														)}
														<span className={getGroupTitleClass(depth + 1)}>
															{singleLabel} {index + 1}
														</span>
													</button>
													<ObjectTileAction
														type="remove"
														disabled={disabled}
														onClick={() => handleRemoveItem(index)}
													/>
												</div>
												{isItemExpanded ? (
													<div className={getObjectFieldStackClass(depth + 1)}>
														{renderItem(index)}
													</div>
												) : null}
											</div>
										)}
									</SortableArrayItemWrapper>
								);
							})}
						</div>
					</SortableContext>
				</DndContext>
			) : null}
			{renderFieldError(fieldError ?? undefined, classNames)}
		</div>
	);
};

type ObjectArrayFieldProps = Omit<
	SortableCollectionFieldProps<Record<string, unknown>>,
	'createItem'
> & {
	itemBase: z.ZodObject<z.ZodRawShape>;
};

const ObjectArrayField = ({ itemBase, ...props }: ObjectArrayFieldProps) => {
	return (
		<SortableCollectionField
			{...props}
			createItem={() => {
				const parsed = itemBase.safeParse({});
				if (
					parsed.success &&
					parsed.data &&
					typeof parsed.data === 'object' &&
					!Array.isArray(parsed.data)
				) {
					return parsed.data;
				}
				return {};
			}}
		/>
	);
};

type NestedArrayFieldProps = Omit<
	SortableCollectionFieldProps<unknown>,
	'createItem'
> & {
	itemBase: z.ZodTypeAny;
};

const NestedArrayField = ({ itemBase, ...props }: NestedArrayFieldProps) => {
	return (
		<SortableCollectionField
			{...props}
			createItem={() => {
				const parsed = itemBase.safeParse([]);
				return parsed.success ? parsed.data : [];
			}}
		/>
	);
};

const singularize = (word: string): string => {
	if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
	if (/(?:s|x|z|ch|sh)es$/.test(word)) return word.slice(0, -2);
	if (word.endsWith('s') && !word.endsWith('ss') && word.length > 3) {
		return word.slice(0, -1);
	}
	return word;
};

const deepSet = (node: unknown, path: string[], value: unknown): unknown => {
	if (path.length === 0) return value;

	const head = path[0] as string;
	const tail = path.slice(1);

	if (Array.isArray(node) && /^\d+$/.test(head)) {
		const index = Number(head);
		const arr = [...node];
		arr[index] = deepSet(arr[index], tail, value);
		return arr;
	}

	const record: Record<string, unknown> =
		node && typeof node === 'object' && !Array.isArray(node)
			? (node as Record<string, unknown>)
			: {};

	if (tail.length === 0) {
		if (value === undefined) {
			const next = { ...record };
			delete next[head];
			return next;
		}
		return { ...record, [head]: value };
	}

	return { ...record, [head]: deepSet(record[head], tail, value) };
};

const renderField = ({
	keyName,
	schema,
	path,
	rootValue,
	onRootChange,
	disabled,
	errors,
	formatKey,
	setTransientFieldError,
	clearTransientFieldError,
	isSensitivePath,
	isSecretVisible,
	setSecretVisible,
	isObjectExpanded,
	toggleObjectExpanded,
	setObjectExpanded,
	depth,
	classNames,
}: {
	keyName: string;
	schema: z.ZodTypeAny;
	path: string[];
	rootValue: Record<string, unknown>;
	onRootChange: (next: Record<string, unknown>) => void;
	disabled?: boolean;
	errors?: Record<string, string>;
	formatKey: (key: string) => string;
	setTransientFieldError: (path: string[], message: string) => void;
	clearTransientFieldError: (path: string[]) => void;
	isSensitivePath: (path: string[]) => boolean;
	isSecretVisible: (path: string[]) => boolean;
	setSecretVisible: (path: string[], visible: boolean) => void;
	isObjectExpanded: (path: string[]) => boolean;
	toggleObjectExpanded: (path: string[]) => void;
	setObjectExpanded: (path: string[], expanded: boolean) => void;
	depth: number;
	classNames?: SchemaObjectFormClassNames;
}) => {
	const { base, isOptional, isNullable } = unwrapSchema(schema);
	const description =
		getSchemaDescription(schema) ?? getSchemaDescription(base);
	const currentValue = ObjectUtils.getValueAtPath(rootValue, path);

	const onChangeValue = (
		value: unknown,
		options?: { clearTransientError?: boolean }
	) => {
		if (options?.clearTransientError !== false) {
			clearTransientFieldError(path);
		}
		onRootChange(deepSet(rootValue, path, value) as Record<string, unknown>);
	};
	const fieldError = getFieldError(errors, path);
	const fieldId = `schema-field-${path.join('-')}`;
	const label = formatKey(keyName);
	const pathKey = path.join('.');

	if (base instanceof z.ZodObject) {
		const shape = base.shape;
		const objectFieldError = getFieldError(errors, path, false);
		const isRemovableObject = isOptional || isNullable;
		const isExpanded = isObjectExpanded(path);
		const hasObjectValue =
			currentValue !== null &&
			currentValue !== undefined &&
			typeof currentValue === 'object' &&
			!Array.isArray(currentValue);

		if (isRemovableObject && !hasObjectValue) {
			return (
				<div key={path.join('.')} className={getObjectGroupClass(depth)}>
					<div className="flex items-center gap-2">
						<ObjectTileAction
							type="add"
							disabled={disabled}
							onClick={() => {
								const parsed = base.safeParse({});
								const nextValue =
									parsed.success &&
									parsed.data &&
									typeof parsed.data === 'object' &&
									!Array.isArray(parsed.data)
										? parsed.data
										: {};

								setObjectExpanded(path, true);
								onChangeValue(nextValue);
							}}
						/>
						<div className="min-w-0">
							<span className={getGroupTitleClass(depth)}>{label}</span>
							{description ? (
								<p className="text-xs text-muted-foreground">{description}</p>
							) : null}
						</div>
					</div>
					{renderFieldError(fieldError, classNames)}
				</div>
			);
		}

		return (
			<div key={path.join('.')} className={getObjectGroupClass(depth)}>
				<div className="flex items-stretch gap-2">
					<button
						type="button"
						onClick={() => toggleObjectExpanded(path)}
						className="flex min-w-0 flex-1 items-center gap-2 text-left"
						aria-expanded={isExpanded}
					>
						{isExpanded ? (
							<ChevronUpIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
						) : (
							<ChevronDownIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
						)}
						<span className="min-w-0">
							<span className={getGroupTitleClass(depth)}>{label}</span>
							{description ? (
								<p className="text-xs text-muted-foreground">{description}</p>
							) : null}
						</span>
					</button>
					{isRemovableObject ? (
						<ObjectTileAction
							type="remove"
							disabled={disabled}
							onClick={() => {
								onChangeValue(isOptional ? undefined : null);
							}}
						/>
					) : null}
				</div>
				{isExpanded ? (
					<div className={getObjectFieldStackClass(depth)}>
						{Object.entries(shape).map(([childKey, childSchema]) =>
							renderField({
								keyName: childKey,
								schema: childSchema,
								path: [...path, childKey],
								rootValue,
								onRootChange,
								disabled,
								errors,
								formatKey,
								setTransientFieldError,
								clearTransientFieldError,
								isSensitivePath,
								isSecretVisible,
								setSecretVisible,
								isObjectExpanded,
								toggleObjectExpanded,
								setObjectExpanded,
								depth: depth + 1,
								classNames,
							})
						)}
					</div>
				) : null}
				{renderFieldError(objectFieldError, classNames)}
			</div>
		);
	}

	if (base instanceof z.ZodBoolean) {
		return (
			<label
				key={path.join('.')}
				htmlFor={fieldId}
				className="flex items-center gap-2 text-xs"
			>
				<Input
					id={fieldId}
					type="checkbox"
					checked={Boolean(currentValue)}
					onChange={(event) => onChangeValue(event.target.checked)}
					disabled={disabled}
					className="mt-0.5 size-4 shrink-0"
				/>
				<span className="min-w-0">
					<span className="block wrap-break-word">{label}</span>
					{description ? (
						<span className="block wrap-break-word text-muted-foreground">
							{description}
						</span>
					) : null}
				</span>
			</label>
		);
	}

	if (base instanceof z.ZodNumber) {
		return (
			<label key={path.join('.')} htmlFor={fieldId} className="block text-xs">
				<span className="mb-1 block font-medium">{label}</span>
				<Input
					id={fieldId}
					type="number"
					value={typeof currentValue === 'number' ? currentValue : ''}
					onChange={(event) => {
						if (event.target.value.trim() === '') {
							onChangeValue(isOptional ? undefined : isNullable ? null : 0);
							return;
						}
						const parsed = Number(event.target.value);
						onChangeValue(Number.isNaN(parsed) ? undefined : parsed);
					}}
					disabled={disabled}
				/>
				{description ? (
					<p className="mt-1 text-muted-foreground">{description}</p>
				) : null}
				{renderFieldError(fieldError, classNames)}
			</label>
		);
	}

	if (isSensitivePath(path) && isStringLikeSchema(schema)) {
		const hasExistingValue =
			typeof currentValue === 'string' && currentValue.length > 0;
		const isVisible = isSecretVisible(path);
		const isLocked = hasExistingValue && !isVisible;
		const inputValue = typeof currentValue === 'string' ? currentValue : '';
		const maskedValue = hasExistingValue ? '********************' : '';

		return (
			<div key={pathKey} className="block text-xs">
				<span className="mb-1 block font-medium">{label}</span>
				<div className="flex flex-row items-stretch gap-2">
					{hasExistingValue ? (
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={disabled}
							onClick={() => setSecretVisible(path, !isVisible)}
							className="h-auto self-stretch"
						>
							{isVisible ? (
								<EyeOffIcon className="mr-0.5 size-3.5" />
							) : (
								<EyeIcon className="mr-0.5 size-3.5" />
							)}
							<span className="inline-grid">
								<span className="invisible col-start-1 row-start-1">Show</span>
								<span className="col-start-1 row-start-1">
									{isVisible ? 'Hide' : 'Show'}
								</span>
							</span>
						</Button>
					) : null}
					<Input
						id={fieldId}
						type="text"
						value={isLocked ? maskedValue : inputValue}
						readOnly={isLocked}
						autoComplete="off"
						autoCorrect="off"
						autoCapitalize="none"
						spellCheck={false}
						data-lpignore="true"
						data-1p-ignore="true"
						onChange={(event) => {
							if (isLocked) {
								return;
							}

							if (event.target.value === '') {
								onChangeValue(isOptional ? undefined : isNullable ? null : '');
								return;
							}
							onChangeValue(event.target.value);
						}}
						disabled={disabled}
						className={cn(
							isLocked ? 'cursor-not-allowed opacity-80' : undefined
						)}
					/>
				</div>
				{description ? (
					<p className="mt-1 text-muted-foreground">{description}</p>
				) : null}
				{renderFieldError(fieldError, classNames)}
			</div>
		);
	}

	const enumOptions = getEnumOptions(schema);
	if (enumOptions) {
		const selectedOption = enumOptions.find(
			(option) =>
				Object.is(currentValue, option.rawValue) ||
				String(currentValue) === option.selectValue
		);
		const selectedValue = selectedOption?.selectValue ?? '';

		return (
			<div key={path.join('.')} className="block text-xs">
				<span className="mb-1 block font-medium">{label}</span>
				<Select
					value={selectedValue}
					onValueChange={(nextValue) => {
						const nextOption = enumOptions.find(
							(option) => option.selectValue === nextValue
						);
						onChangeValue(nextOption?.rawValue ?? nextValue);
					}}
					disabled={disabled}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder={`Select ${label}`} />
					</SelectTrigger>
					<SelectContent>
						{enumOptions.map((option) => (
							<SelectItem key={option.selectValue} value={option.selectValue}>
								{formatKey(option.labelKey)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{description ? (
					<p className="mt-1 text-muted-foreground">{description}</p>
				) : null}
				{renderFieldError(fieldError, classNames)}
			</div>
		);
	}

	if (base instanceof z.ZodArray) {
		const itemSchema = (base as unknown as { element: z.ZodTypeAny }).element;
		const { base: itemBase } = unwrapSchema(itemSchema);
		const itemEnumOptions = getEnumOptions(itemSchema);

		if (itemEnumOptions) {
			const currentItems = Array.isArray(currentValue) ? currentValue : [];
			const selectedOptions = itemEnumOptions.filter((option) =>
				currentItems.some((item) => Object.is(item, option.rawValue))
			);
			const availableOptions = itemEnumOptions.filter(
				(option) =>
					!selectedOptions.some((selected) =>
						Object.is(selected.rawValue, option.rawValue)
					)
			);

			return (
				<div key={path.join('.')} className="block text-xs">
					<span className="mb-1 block font-medium">{label}</span>
					<Select
						value=""
						onValueChange={(nextValue) => {
							const nextOption = itemEnumOptions.find(
								(option) => option.selectValue === nextValue
							);
							if (!nextOption) {
								return;
							}

							onChangeValue([
								...selectedOptions.map((option) => option.rawValue),
								nextOption.rawValue,
							]);
						}}
						disabled={disabled || availableOptions.length === 0}
					>
						<SelectTrigger className="w-full">
							<SelectValue placeholder={`Add ${label}`} />
						</SelectTrigger>
						<SelectContent>
							{availableOptions.map((option) => (
								<SelectItem key={option.selectValue} value={option.selectValue}>
									{formatKey(option.labelKey)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{selectedOptions.length > 0 ? (
						<div className="mt-2 flex flex-wrap gap-2">
							{selectedOptions.map((option) => (
								<Badge
									key={option.selectValue}
									variant="secondary"
									className="gap-2"
								>
									{formatKey(option.labelKey)}
									<button
										type="button"
										onClick={() => {
											const next = selectedOptions
												.filter(
													(selected) =>
														!Object.is(selected.rawValue, option.rawValue)
												)
												.map((selected) => selected.rawValue);

											onChangeValue(
												next.length === 0
													? isOptional
														? undefined
														: isNullable
															? null
															: []
													: next
											);
										}}
										disabled={disabled}
										className="text-xs leading-none"
									>
										x
									</button>
								</Badge>
							))}
						</div>
					) : null}
					{description ? (
						<p className="mt-1 text-muted-foreground">{description}</p>
					) : null}
					{renderFieldError(fieldError, classNames)}
				</div>
			);
		}

		if (isStringLikeSchema(itemSchema)) {
			const items = Array.isArray(currentValue)
				? currentValue.filter(
						(item): item is string => typeof item === 'string'
					)
				: [];

			return (
				<div key={path.join('.')} className="block space-y-1 text-xs">
					<span className="block font-medium">{label}</span>
					<InlineStringListEditor
						value={items}
						onChange={(nextItems) => {
							if (nextItems.length === 0) {
								onChangeValue(isOptional ? undefined : isNullable ? null : []);
								return;
							}

							const previousItems = items;
							const addedItems = nextItems.filter(
								(item) => !previousItems.includes(item)
							);

							if (addedItems.length === 0) {
								onChangeValue(nextItems);
								return;
							}

							let firstInvalidMessage: string | null = null;
							const validAddedItems = addedItems.filter((item) => {
								const parsed = itemSchema.safeParse(item);
								if (!parsed.success && !firstInvalidMessage) {
									firstInvalidMessage =
										parsed.error.issues[0]?.message || 'Invalid array item.';
								}
								return parsed.success;
							});

							const sanitizedNextItems = nextItems.filter(
								(item) =>
									previousItems.includes(item) || validAddedItems.includes(item)
							);

							if (firstInvalidMessage) {
								setTransientFieldError(path, firstInvalidMessage);
							} else {
								clearTransientFieldError(path);
							}

							onChangeValue(sanitizedNextItems, {
								clearTransientError: !firstInvalidMessage,
							});
						}}
						editable={!disabled}
						placeholder={`Add ${label}...`}
					/>
					{description ? (
						<p className="mt-1 text-muted-foreground">{description}</p>
					) : null}
					{renderFieldError(fieldError, classNames)}
				</div>
			);
		}

		if (itemBase instanceof z.ZodObject) {
			const items = Array.isArray(currentValue)
				? currentValue.filter(
						(item): item is Record<string, unknown> =>
							item !== null && typeof item === 'object' && !Array.isArray(item)
					)
				: [];

			const singleLabel = formatKey(singularize(keyName));

			return (
				<ObjectArrayField
					key={path.join('.')}
					path={path}
					label={label}
					singleLabel={singleLabel}
					description={description}
					itemBase={itemBase}
					items={items}
					isOptional={isOptional}
					isNullable={isNullable}
					depth={depth}
					disabled={disabled}
					fieldError={fieldError}
					onChangeValue={onChangeValue}
					isObjectExpanded={isObjectExpanded}
					toggleObjectExpanded={toggleObjectExpanded}
					setObjectExpanded={setObjectExpanded}
					classNames={classNames}
					renderItem={(index) => {
						const itemPath = [...path, String(index)];
						return Object.entries(itemBase.shape).map(
							([childKey, childSchema]) =>
								renderField({
									keyName: childKey,
									schema: childSchema,
									path: [...itemPath, childKey],
									rootValue,
									onRootChange,
									disabled,
									errors,
									formatKey,
									setTransientFieldError,
									clearTransientFieldError,
									isSensitivePath,
									isSecretVisible,
									setSecretVisible,
									isObjectExpanded,
									toggleObjectExpanded,
									setObjectExpanded,
									depth: depth + 2,
									classNames,
								})
						);
					}}
				/>
			);
		}

		if (itemBase instanceof z.ZodArray) {
			const items = Array.isArray(currentValue) ? currentValue : [];
			const singleLabel = formatKey(singularize(keyName));

			return (
				<NestedArrayField
					key={path.join('.')}
					path={path}
					label={label}
					singleLabel={singleLabel}
					description={description}
					itemBase={itemBase}
					items={items}
					isOptional={isOptional}
					isNullable={isNullable}
					depth={depth}
					disabled={disabled}
					fieldError={fieldError}
					onChangeValue={onChangeValue}
					isObjectExpanded={isObjectExpanded}
					toggleObjectExpanded={toggleObjectExpanded}
					setObjectExpanded={setObjectExpanded}
					classNames={classNames}
					renderItem={(index) =>
						renderField({
							keyName: singularize(keyName),
							schema: itemSchema,
							path: [...path, String(index)],
							rootValue,
							onRootChange,
							disabled,
							errors,
							formatKey,
							setTransientFieldError,
							clearTransientFieldError,
							isSensitivePath,
							isSecretVisible,
							setSecretVisible,
							isObjectExpanded,
							toggleObjectExpanded,
							setObjectExpanded,
							depth: depth + 2,
							classNames,
						})
					}
				/>
			);
		}
	}

	return (
		<label key={path.join('.')} htmlFor={fieldId} className="block text-xs">
			<span className="mb-1 block font-medium">{label}</span>
			<Input
				id={fieldId}
				type="text"
				value={typeof currentValue === 'string' ? currentValue : ''}
				onChange={(event) => {
					if (event.target.value === '') {
						onChangeValue(isOptional ? undefined : isNullable ? null : '');
						return;
					}
					onChangeValue(event.target.value);
				}}
				disabled={disabled}
			/>
			{description ? (
				<p className="mt-1 text-muted-foreground">{description}</p>
			) : null}
			{renderFieldError(fieldError, classNames)}
		</label>
	);
};

export function SchemaObjectForm({
	schema,
	value,
	onChange,
	disabled,
	errors,
	formatKeys = true,
	keyFormatter,
	sensitiveFieldPaths,
	className,
	classNames,
	slotProps,
}: SchemaObjectFormProps): React.JSX.Element {
	const [transientErrors, setTransientErrors] = useState<
		Record<string, string>
	>({});
	const [secretVisiblePathMap, setSecretVisiblePathMap] = useState<
		Record<string, boolean>
	>({});
	const [expandedObjectPathMap, setExpandedObjectPathMap] = useState<
		Record<string, boolean>
	>({});

	const sensitivePathSet = useMemo(
		() => new Set(sensitiveFieldPaths ?? []),
		[sensitiveFieldPaths]
	);

	const setTransientFieldError = useCallback(
		(path: string[], message: string) => {
			const key = path.join('.');
			setTransientErrors((prev) => ({
				...prev,
				[key]: message,
			}));
		},
		[]
	);

	const clearTransientFieldError = useCallback((path: string[]) => {
		const key = path.join('.');
		setTransientErrors((prev) => {
			let changed = false;
			const next = { ...prev };
			for (const errorKey of Object.keys(next)) {
				if (errorKey === key || errorKey.startsWith(`${key}.`)) {
					delete next[errorKey];
					changed = true;
				}
			}

			return changed ? next : prev;
		});
	}, []);

	const isSensitivePath = useCallback(
		(path: string[]) => sensitivePathSet.has(path.join('.')),
		[sensitivePathSet]
	);

	const isSecretVisible = useCallback(
		(path: string[]) => Boolean(secretVisiblePathMap[path.join('.')]),
		[secretVisiblePathMap]
	);

	const setSecretVisible = useCallback((path: string[], visible: boolean) => {
		const key = path.join('.');
		setSecretVisiblePathMap((prev) => {
			if (visible === Boolean(prev[key])) {
				return prev;
			}
			if (visible) {
				return {
					...prev,
					[key]: true,
				};
			}
			const next = { ...prev };
			delete next[key];
			return next;
		});
	}, []);

	const isObjectExpanded = useCallback(
		(path: string[]) => Boolean(expandedObjectPathMap[path.join('.')]),
		[expandedObjectPathMap]
	);

	const toggleObjectExpanded = useCallback((path: string[]) => {
		const key = path.join('.');
		setExpandedObjectPathMap((prev) => {
			const next = { ...prev };
			if (next[key]) {
				delete next[key];
				return next;
			}

			next[key] = true;
			return next;
		});
	}, []);

	const setObjectExpanded = useCallback((path: string[], expanded: boolean) => {
		const key = path.join('.');
		setExpandedObjectPathMap((prev) => {
			if (Boolean(prev[key]) === expanded) {
				return prev;
			}

			if (expanded) {
				return {
					...prev,
					[key]: true,
				};
			}

			const next = { ...prev };
			delete next[key];
			return next;
		});
	}, []);

	const { base } = unwrapSchema(schema);

	const unsupportedSchemaProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLParagraphElement>
	>(
		{
			className: 'text-xs text-red-600',
		},
		slotProps?.unsupportedSchema,
		classNames?.unsupportedSchema
	);

	if (!(base instanceof z.ZodObject)) {
		return (
			<p {...unsupportedSchemaProps}>
				Schema renderer currently supports object schemas only.
			</p>
		);
	}

	const shape = base.shape;
	const normalizedValue = value ?? {};
	const formatKey =
		keyFormatter ?? (formatKeys ? ObjectUtils.formatObjectPath : (key) => key);
	const mergedErrors = {
		...(errors ?? {}),
		...transientErrors,
	};

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: 'space-y-2',
		},
		slotProps?.container,
		className,
		classNames?.container
	);

	const rootErrorProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLParagraphElement>
	>(
		{
			className: 'text-xs text-red-600',
		},
		slotProps?.rootError,
		classNames?.rootError
	);

	return (
		<div {...containerProps}>
			{errors?.root ? <p {...rootErrorProps}>{errors.root}</p> : null}
			{Object.entries(shape).map(([key, childSchema]) =>
				renderField({
					keyName: key,
					schema: childSchema,
					path: [key],
					rootValue: normalizedValue,
					onRootChange: onChange,
					disabled,
					errors: mergedErrors,
					formatKey,
					setTransientFieldError,
					clearTransientFieldError,
					isSensitivePath,
					isSecretVisible,
					setSecretVisible,
					isObjectExpanded,
					toggleObjectExpanded,
					setObjectExpanded,
					depth: 0,
					classNames,
				})
			)}
		</div>
	);
}
