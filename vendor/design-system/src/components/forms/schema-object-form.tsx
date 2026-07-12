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
	getSchemaJSONFieldOptions,
	getSchemaTemporalFieldOptions,
	getSchemaTextFieldOptions,
	isStringLikeSchema,
	unwrapSchema,
} from '@md-oss/common/schemas/schema-object-form';
import { ObjectUtils } from '@md-oss/common/utils';
import {
	AdaptiveTooltip,
	AdaptiveTooltipContent,
	AdaptiveTooltipTrigger,
} from '@md-oss/design-system/components/adaptive/tooltip';
import { Badge } from '@md-oss/design-system/components/ui/badge';
import { Button } from '@md-oss/design-system/components/ui/button';
import { Calendar } from '@md-oss/design-system/components/ui/calendar';
import { InlineStringListEditor } from '@md-oss/design-system/components/ui/extended/inline-edit';
import { Input } from '@md-oss/design-system/components/ui/input';
import { JSONEditor } from '@md-oss/design-system/components/ui/json-editor';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@md-oss/design-system/components/ui/popover';
import { RelativeTimeCard } from '@md-oss/design-system/components/ui/relative-time-card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@md-oss/design-system/components/ui/select';
import { Textarea } from '@md-oss/design-system/components/ui/textarea';
import {
	TimePickerContent,
	TimePickerHour,
	TimePickerInput,
	TimePickerInputGroup,
	TimePickerMinute,
	TimePickerPeriod,
	TimePicker as TimePickerRoot,
	TimePickerSecond,
	TimePickerSeparator,
	TimePickerTrigger,
} from '@md-oss/design-system/components/ui/time-picker';
import type { UseSchemaObjectFormControllerReturn } from '@md-oss/design-system/hooks/use-schema-object-form-controller';
import {
	appendStableOrderId,
	ensureStableOrderIds,
	removeStableOrderIdAt,
	reorderByStableIds,
} from '@md-oss/design-system/lib/dnd';
import {
	cn,
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import {
	CalendarIcon,
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

type SchemaObjectFormDescriptionType = 'hover-icon' | 'static-block';

type SchemaObjectFormClassNames = {
	container?: string;
	rootError?: string;
	unsupportedSchema?: string;
	fieldError?: string;
};

export type SchemaObjectFormProps<
	TData extends Record<string, unknown> = Record<string, unknown>,
> = {
	schema: z.ZodType<TData>;
	value: TData;
	onChange: (next: TData) => void;
	disabled?: boolean;
	errors?: Record<string, string>;
	descriptionType?: SchemaObjectFormDescriptionType;
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

export type SchemaObjectFormControllerIntegration<
	TData extends Record<string, unknown> = Record<string, unknown>,
> = UseSchemaObjectFormControllerReturn<TData>;

export type SchemaObjectFormWithControllerProps<
	TData extends Record<string, unknown> = Record<string, unknown>,
> = SchemaObjectFormProps<TData> & {
	controller?: SchemaObjectFormControllerIntegration<TData>;
	htmlFormProps?: Omit<
		React.HTMLAttributes<HTMLFormElement>,
		'onSubmit' | 'children'
	>;
	children?: React.ReactNode;
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
	descriptionType: SchemaObjectFormDescriptionType;
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

type RenderFieldDescriptionProps = {
	type?: SchemaObjectFormDescriptionType;
	description?: string | null;
	className?: string;
	slotProps?: {
		span?: WithAsComponent<React.HTMLAttributes<HTMLSpanElement>>;
		tooltip?: {
			content?: WithAsComponent<
				React.ComponentPropsWithoutRef<typeof AdaptiveTooltipContent>
			>;
			trigger?: WithAsComponent<
				React.ComponentPropsWithoutRef<typeof AdaptiveTooltipTrigger>
			>;
		};
	};
};

const RenderFieldDescription = ({
	type = 'static-block',
	description,
	className,
	slotProps,
}: RenderFieldDescriptionProps) => {
	if (!description) {
		return null;
	}

	const [Element, elementSlotProps] = resolveSlot('span', slotProps?.span);

	const elementProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLSpanElement>
	>(
		{
			className: cn(
				'text-xs',
				type !== 'hover-icon' && 'text-muted-foreground'
			),
		},
		elementSlotProps,
		className
	);

	if (type === 'hover-icon') {
		const [AdaptiveTooltipTriggerComponent, adaptiveTooltipTriggerSlotProps] =
			resolveSlot(AdaptiveTooltipTrigger, slotProps?.tooltip?.trigger);
		const [AdaptiveTooltipContentComponent, adaptiveTooltipContentSlotProps] =
			resolveSlot(AdaptiveTooltipContent, slotProps?.tooltip?.content);

		const safeElementId =
			elementProps.id ?? `schema-field-description-${useId()}`;

		const adaptiveTooltipTriggerProps = mergePropsWithClassName(
			{
				asChild: true,
				'aria-label': 'Field description',
				'aria-describedby': `${safeElementId}-helper`,
			},
			adaptiveTooltipTriggerSlotProps
		);
		const adaptiveTooltipContentProps = mergePropsWithClassName(
			{},
			adaptiveTooltipContentSlotProps
		);

		return (
			<AdaptiveTooltip>
				<span
					id={adaptiveTooltipTriggerProps['aria-describedby']}
					className="sr-only"
				>
					{description}
				</span>
				<AdaptiveTooltipTriggerComponent {...adaptiveTooltipTriggerProps}>
					<EyeIcon className="h-3 w-3 text-primary" />
				</AdaptiveTooltipTriggerComponent>
				<AdaptiveTooltipContentComponent {...adaptiveTooltipContentProps}>
					<Element {...elementProps}>{description}</Element>
				</AdaptiveTooltipContentComponent>
			</AdaptiveTooltip>
		);
	}

	return <Element {...elementProps}>{description}</Element>;
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
	descriptionType,
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
					{descriptionType === 'hover-icon' ? (
						<span className="min-w-0 flex items-center gap-1">
							<span className={getGroupTitleClass(depth)}>{label}</span>
							<RenderFieldDescription
								type={descriptionType}
								description={
									descriptionType === 'hover-icon' ? description : null
								}
							/>
						</span>
					) : (
						<div className="min-w-0">
							<span className={getGroupTitleClass(depth)}>{label}</span>
							<RenderFieldDescription
								type={descriptionType}
								description={description}
								slotProps={{
									span: { asComponent: 'p' },
								}}
							/>
						</div>
					)}
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
					{descriptionType === 'hover-icon' ? (
						<span className="min-w-0 flex items-center gap-1">
							<span className={getGroupTitleClass(depth)}>{label}</span>
							<RenderFieldDescription
								type={descriptionType}
								description={
									descriptionType === 'hover-icon' ? description : null
								}
							/>
						</span>
					) : (
						<span className="min-w-0">
							<span className={getGroupTitleClass(depth)}>{label}</span>
							<RenderFieldDescription
								type={descriptionType}
								description={description}
								slotProps={{
									span: { asComponent: 'p' },
								}}
							/>
						</span>
					)}
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

const formatTimePickerValue = (date: Date, showSeconds: boolean): string => {
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');

	if (!showSeconds) {
		return `${hours}:${minutes}`;
	}

	const seconds = String(date.getSeconds()).padStart(2, '0');
	return `${hours}:${minutes}:${seconds}`;
};

const applyTimePickerValue = (
	baseDate: Date,
	timeValue: string
): Date | null => {
	if (!timeValue) {
		return null;
	}

	const parts = timeValue.split(':');
	if (parts.length < 2) {
		return null;
	}

	const hours = Number.parseInt(parts[0] ?? '', 10);
	const minutes = Number.parseInt(parts[1] ?? '', 10);
	const seconds = Number.parseInt(parts[2] ?? '0', 10);

	if (Number.isNaN(hours) || Number.isNaN(minutes) || Number.isNaN(seconds)) {
		return null;
	}

	const nextDate = new Date(baseDate);
	nextDate.setHours(hours, minutes, seconds, 0);
	return nextDate;
};

const renderField = <TData extends Record<string, unknown>>({
	controller,
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
	descriptionType,
}: {
	controller?: SchemaObjectFormControllerIntegration<TData>;
	keyName: string;
	schema: z.ZodTypeAny;
	path: string[];
	rootValue: TData;
	onRootChange: (next: TData) => void;
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
	descriptionType: SchemaObjectFormDescriptionType;
}) => {
	const { base, isOptional, isNullable, isReadonly } = unwrapSchema(schema);
	const description =
		getSchemaDescription(schema) ?? getSchemaDescription(base);
	const currentValue = ObjectUtils.getValueAtPath(rootValue, path);
	const isFieldDisabled = disabled || isReadonly;

	const onChangeValue = (
		value: unknown,
		options?: { clearTransientError?: boolean }
	) => {
		if (options?.clearTransientError !== false) {
			clearTransientFieldError(path);
		}
		onRootChange(deepSet(rootValue, path, value) as TData);
	};
	const fieldError = getFieldError(errors, path);
	const fieldId = `schema-field-${path.join('-')}`;
	const label = formatKey(keyName);
	const pathKey = path.join('.');
	const textFieldOptions = getSchemaTextFieldOptions(schema);
	const temporalFieldOptions = getSchemaTemporalFieldOptions(schema);
	const shouldRenderTextarea =
		textFieldOptions.control === 'textarea' && isStringLikeSchema(schema);
	const currentDateValue =
		currentValue instanceof Date
			? currentValue
			: typeof currentValue === 'string' || typeof currentValue === 'number'
				? new Date(currentValue)
				: null;
	const hasValidDateValue =
		currentDateValue instanceof Date &&
		!Number.isNaN(currentDateValue.getTime());
	const temporalControl = temporalFieldOptions?.control ?? 'date';
	const showTimeInput =
		temporalControl === 'time' || temporalControl === 'datetime';
	const showDateInput =
		temporalControl === 'date' || temporalControl === 'datetime';
	const timePickerValue = hasValidDateValue
		? formatTimePickerValue(
				currentDateValue,
				Boolean(temporalFieldOptions?.showSeconds)
			)
		: '';

	const jsonOptions = getSchemaJSONFieldOptions(schema);
	if (jsonOptions?.control === 'json') {
		return (
			<div key={path.join('.')} className="block text-xs">
				<span className="mb-1 flex items-center gap-1">
					{controller?.RichLabel ? (
						<controller.RichLabel schemaKey={keyName}>
							{label}
						</controller.RichLabel>
					) : (
						<span className="block font-medium">{label}</span>
					)}
					<RenderFieldDescription
						type={descriptionType}
						description={descriptionType === 'hover-icon' ? description : null}
					/>
				</span>
				<JSONEditor
					id={fieldId}
					rows={jsonOptions?.rows ?? 8}
					className={cn(jsonOptions?.rows && 'field-sizing-fixed')}
					value={currentValue}
					onChange={(value) => {
						clearTransientFieldError(path);
						onChangeValue(value);
					}}
					onJsonError={(error) => {
						if (error && jsonOptions?.validate !== false) {
							setTransientFieldError(path, error.message);
						} else if (!error) {
							clearTransientFieldError(path);
						}
					}}
					disabled={isFieldDisabled}
				/>
				<RenderFieldDescription
					type={descriptionType}
					description={descriptionType === 'static-block' ? description : null}
					className="mt-1"
					slotProps={{
						span: { asComponent: 'p' },
					}}
				/>
				{renderFieldError(fieldError, classNames)}
			</div>
		);
	}

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
							disabled={isFieldDisabled}
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
						{descriptionType === 'hover-icon' ? (
							<span className="min-w-0 flex items-center gap-1">
								<span className={getGroupTitleClass(depth)}>{label}</span>
								<RenderFieldDescription
									type={descriptionType}
									description={
										descriptionType === 'hover-icon' ? description : null
									}
								/>
							</span>
						) : (
							<div className="min-w-0">
								<span className={getGroupTitleClass(depth)}>{label}</span>
								<RenderFieldDescription
									type={descriptionType}
									description={description}
									slotProps={{
										span: { asComponent: 'p' },
									}}
								/>
							</div>
						)}
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
						{descriptionType === 'hover-icon' ? (
							<span className="min-w-0 flex items-center gap-1">
								<span className={getGroupTitleClass(depth)}>{label}</span>
								<RenderFieldDescription
									type={descriptionType}
									description={
										descriptionType === 'hover-icon' ? description : null
									}
								/>
							</span>
						) : (
							<span className="min-w-0">
								<span className={getGroupTitleClass(depth)}>{label}</span>
								<RenderFieldDescription
									type={descriptionType}
									description={description}
									slotProps={{
										span: { asComponent: 'p' },
									}}
								/>
							</span>
						)}
					</button>
					{isRemovableObject ? (
						<ObjectTileAction
							type="remove"
							disabled={isFieldDisabled}
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
								controller,
								keyName: childKey,
								schema: childSchema,
								path: [...path, childKey],
								rootValue,
								onRootChange,
								disabled: isFieldDisabled,
								descriptionType,
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
					disabled={isFieldDisabled}
					className="mt-0.5 size-4 shrink-0"
				/>
				{descriptionType === 'static-block' ? (
					<span className="min-w-0">
						<span className="block wrap-break-word">{label}</span>
						<RenderFieldDescription
							type={descriptionType}
							description={description}
							className="block wrap-break-word"
						/>
					</span>
				) : (
					<span className="min-w-0 flex items-center gap-1">
						{controller?.RichLabel ? (
							<controller.RichLabel schemaKey={keyName}>
								{label}
							</controller.RichLabel>
						) : (
							<span className="block font-medium">{label}</span>
						)}
						<RenderFieldDescription
							type={descriptionType}
							description={
								descriptionType === 'hover-icon' ? description : null
							}
						/>
					</span>
				)}
			</label>
		);
	}

	if (base instanceof z.ZodNumber) {
		return (
			<label key={path.join('.')} htmlFor={fieldId} className="block text-xs">
				<span className="mb-1 flex items-center gap-1">
					{controller?.RichLabel ? (
						<controller.RichLabel schemaKey={keyName}>
							{label}
						</controller.RichLabel>
					) : (
						<span className="block font-medium">{label}</span>
					)}
					<RenderFieldDescription
						type={descriptionType}
						description={descriptionType === 'hover-icon' ? description : null}
					/>
				</span>
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
					disabled={isFieldDisabled}
				/>
				<RenderFieldDescription
					type={descriptionType}
					description={descriptionType === 'static-block' ? description : null}
					className="mt-1"
					slotProps={{
						span: { asComponent: 'p' },
					}}
				/>
				{renderFieldError(fieldError, classNames)}
			</label>
		);
	}

	if (base instanceof z.ZodDate) {
		return (
			<div key={path.join('.')} className="block text-xs">
				<span className="mb-1 flex items-center gap-1">
					{controller?.RichLabel ? (
						<controller.RichLabel schemaKey={keyName}>
							{label}
						</controller.RichLabel>
					) : (
						<span className="block font-medium">{label}</span>
					)}
					<RenderFieldDescription
						type={descriptionType}
						description={descriptionType === 'hover-icon' ? description : null}
					/>
				</span>
				{isReadonly ? (
					hasValidDateValue ? (
						<RelativeTimeCard
							date={currentDateValue}
							variant="muted"
							className="justify-start px-0 text-left"
							timezones={[
								'America/Los_Angeles', // NA West
								'America/New_York', // NA East
								'Europe/Amsterdam', // EU Central
							]}
						/>
					) : (
						<p className="text-xs text-muted-foreground italic">No date</p>
					)
				) : (
					<div className="space-y-2">
						{showDateInput ? (
							<Popover>
								<PopoverTrigger asChild>
									<Button
										type="button"
										variant="outline"
										disabled={isFieldDisabled}
										className={cn(
											'w-full justify-between font-normal',
											!hasValidDateValue && 'text-muted-foreground'
										)}
									>
										{hasValidDateValue ? (
											currentDateValue.toLocaleDateString()
										) : (
											<span>Select {label}</span>
										)}
										<CalendarIcon className="size-4" />
									</Button>
								</PopoverTrigger>
								<PopoverContent
									className="w-auto overflow-hidden p-0"
									align="start"
								>
									<Calendar
										mode="single"
										selected={hasValidDateValue ? currentDateValue : undefined}
										defaultMonth={
											hasValidDateValue ? currentDateValue : undefined
										}
										captionLayout={
											temporalFieldOptions?.captionLayout ?? 'dropdown'
										}
										onSelect={(value) => {
											if (!value) {
												onChangeValue(isNullable ? null : undefined);
												return;
											}

											if (!showTimeInput) {
												onChangeValue(value);
												return;
											}

											const nextDate = hasValidDateValue
												? new Date(currentDateValue)
												: new Date();
											nextDate.setFullYear(
												value.getFullYear(),
												value.getMonth(),
												value.getDate()
											);
											onChangeValue(nextDate);
										}}
									/>
								</PopoverContent>
							</Popover>
						) : null}
						{showTimeInput ? (
							<TimePickerRoot
								value={timePickerValue}
								onValueChange={(value) => {
									if (!value) {
										onChangeValue(isNullable ? null : undefined);
										return;
									}

									const referenceDate =
										hasValidDateValue && temporalControl !== 'time'
											? currentDateValue
											: new Date();
									const nextDate = applyTimePickerValue(referenceDate, value);
									onChangeValue(nextDate ?? (isNullable ? null : undefined));
								}}
								showSeconds={Boolean(temporalFieldOptions?.showSeconds)}
								minuteStep={temporalFieldOptions?.minuteStep}
								hourStep={temporalFieldOptions?.hourStep}
								secondStep={temporalFieldOptions?.secondStep}
								min={temporalFieldOptions?.min}
								max={temporalFieldOptions?.max}
								locale={temporalFieldOptions?.locale}
								disabled={isFieldDisabled}
								className="w-full "
							>
								<TimePickerInputGroup className="w-full">
									<TimePickerInput
										segment="hour"
										aria-label={`${label} hour`}
									/>
									<TimePickerSeparator />
									<TimePickerInput
										segment="minute"
										aria-label={`${label} minute`}
									/>
									{temporalFieldOptions?.showSeconds ? (
										<>
											<TimePickerSeparator />
											<TimePickerInput
												segment="second"
												aria-label={`${label} second`}
											/>
										</>
									) : null}
									<TimePickerTrigger className="ms-auto" />
								</TimePickerInputGroup>
								<TimePickerContent>
									<TimePickerHour />
									<TimePickerMinute />
									{temporalFieldOptions?.showSeconds ? (
										<TimePickerSecond />
									) : null}
									<TimePickerPeriod />
								</TimePickerContent>
							</TimePickerRoot>
						) : null}
					</div>
				)}
				<RenderFieldDescription
					type={descriptionType}
					description={descriptionType === 'static-block' ? description : null}
					className="mt-1"
					slotProps={{
						span: { asComponent: 'p' },
					}}
				/>
				{renderFieldError(fieldError, classNames)}
			</div>
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
				<span className="mb-1 flex items-center gap-1">
					{controller?.RichLabel ? (
						<controller.RichLabel schemaKey={keyName}>
							{label}
						</controller.RichLabel>
					) : (
						<span className="block font-medium">{label}</span>
					)}
					<RenderFieldDescription
						type={descriptionType}
						description={descriptionType === 'hover-icon' ? description : null}
					/>
				</span>
				<div className="flex flex-row items-stretch gap-2">
					{hasExistingValue ? (
						<Button
							type="button"
							size="sm"
							variant="outline"
							disabled={isFieldDisabled}
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
						disabled={isFieldDisabled}
						className={cn(
							isLocked ? 'cursor-not-allowed opacity-80' : undefined
						)}
					/>
				</div>
				<RenderFieldDescription
					type={descriptionType}
					description={descriptionType === 'static-block' ? description : null}
					className="mt-1"
					slotProps={{
						span: { asComponent: 'p' },
					}}
				/>
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
				<span className="mb-1 flex items-center gap-1">
					{controller?.RichLabel ? (
						<controller.RichLabel schemaKey={keyName}>
							{label}
						</controller.RichLabel>
					) : (
						<span className="block font-medium">{label}</span>
					)}
					<RenderFieldDescription
						type={descriptionType}
						description={descriptionType === 'hover-icon' ? description : null}
					/>
				</span>
				<Select
					value={selectedValue}
					onValueChange={(nextValue) => {
						const nextOption = enumOptions.find(
							(option) => option.selectValue === nextValue
						);
						onChangeValue(nextOption?.rawValue ?? nextValue);
					}}
					disabled={isFieldDisabled}
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
				<RenderFieldDescription
					type={descriptionType}
					description={descriptionType === 'static-block' ? description : null}
					className="mt-1"
					slotProps={{
						span: { asComponent: 'p' },
					}}
				/>
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
					<span className="mb-1 flex items-center gap-1">
						<span className="block font-medium">{label}</span>
						<RenderFieldDescription
							type={descriptionType}
							description={
								descriptionType === 'hover-icon' ? description : null
							}
						/>
					</span>
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
						disabled={isFieldDisabled || availableOptions.length === 0}
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
										disabled={isFieldDisabled}
										className="text-xs leading-none"
									>
										x
									</button>
								</Badge>
							))}
						</div>
					) : null}
					<RenderFieldDescription
						type={descriptionType}
						description={
							descriptionType === 'static-block' ? description : null
						}
						className="mt-1"
						slotProps={{
							span: { asComponent: 'p' },
						}}
					/>
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
					<span className="mb-1 flex items-center gap-1">
						<span className="block font-medium">{label}</span>
						<RenderFieldDescription
							type={descriptionType}
							description={
								descriptionType === 'hover-icon' ? description : null
							}
						/>
					</span>
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
						editable={!isFieldDisabled}
						placeholder={`Add ${label}...`}
					/>
					<RenderFieldDescription
						type={descriptionType}
						description={
							descriptionType === 'static-block' ? description : null
						}
						className="mt-1"
						slotProps={{
							span: { asComponent: 'p' },
						}}
					/>
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
					descriptionType={descriptionType}
					itemBase={itemBase}
					items={items}
					isOptional={isOptional}
					isNullable={isNullable}
					depth={depth}
					disabled={isFieldDisabled}
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
									controller,
									keyName: childKey,
									schema: childSchema,
									path: [...itemPath, childKey],
									rootValue,
									onRootChange,
									disabled: isFieldDisabled,
									descriptionType,
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
					descriptionType={descriptionType}
					itemBase={itemBase}
					items={items}
					isOptional={isOptional}
					isNullable={isNullable}
					depth={depth}
					disabled={isFieldDisabled}
					fieldError={fieldError}
					onChangeValue={onChangeValue}
					isObjectExpanded={isObjectExpanded}
					toggleObjectExpanded={toggleObjectExpanded}
					setObjectExpanded={setObjectExpanded}
					classNames={classNames}
					renderItem={(index) =>
						renderField<TData>({
							controller,
							keyName: singularize(keyName),
							schema: itemSchema,
							path: [...path, String(index)],
							rootValue,
							onRootChange,
							disabled: isFieldDisabled,
							descriptionType,
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
			<span className="mb-1 flex items-center gap-1">
				{controller?.RichLabel ? (
					<controller.RichLabel schemaKey={keyName}>
						{label}
					</controller.RichLabel>
				) : (
					<span className="block font-medium">{label}</span>
				)}
				<RenderFieldDescription
					type={descriptionType}
					description={descriptionType === 'hover-icon' ? description : null}
				/>
			</span>
			{shouldRenderTextarea ? (
				<Textarea
					id={fieldId}
					rows={textFieldOptions.rows ?? 4}
					className={cn(textFieldOptions.rows && 'field-sizing-fixed')}
					value={typeof currentValue === 'string' ? currentValue : ''}
					onChange={(event) => {
						if (event.target.value === '') {
							onChangeValue(isOptional ? undefined : isNullable ? null : '');
							return;
						}
						onChangeValue(event.target.value);
					}}
					disabled={isFieldDisabled}
				/>
			) : (
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
					disabled={isFieldDisabled}
				/>
			)}
			<RenderFieldDescription
				type={descriptionType}
				description={descriptionType === 'static-block' ? description : null}
				className="mt-1"
				slotProps={{
					span: { asComponent: 'p' },
				}}
			/>
			{renderFieldError(fieldError, classNames)}
		</label>
	);
};

export function SchemaObjectForm<TData extends Record<string, unknown>>({
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
	controller,
	htmlFormProps = {},
	descriptionType = 'static-block',
	children,
}: SchemaObjectFormWithControllerProps<TData>): React.JSX.Element {
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

	const formContent = (
		<div {...containerProps}>
			{errors?.root ? <p {...rootErrorProps}>{errors.root}</p> : null}
			{Object.entries(shape).map(([key, childSchema]) =>
				renderField({
					keyName: key,
					schema: childSchema,
					controller,
					path: [key],
					rootValue: normalizedValue,
					onRootChange: onChange,
					disabled,
					descriptionType,
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

	if (controller) {
		return (
			<>
				{controller.FormError ? <controller.FormError /> : null}
				<form
					onSubmit={controller.onSubmit}
					{...htmlFormProps}
					className={cn('space-y-4', htmlFormProps.className)}
				>
					{formContent}
					{children}
					{/* {controller.FormControls ? <controller.FormControls /> : null} */}
				</form>
			</>
		);
	}

	return formContent;
}
