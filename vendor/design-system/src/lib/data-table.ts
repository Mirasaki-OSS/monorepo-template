import type { Column, RowData } from '@md-oss/design-system/types/data-table';
import { dataTableConfig } from '../config/data-table';
import type {
	ExtendedColumnFilter,
	FilterOperator,
	FilterVariant,
} from '../types/data-table';

export function getColumnPinningStyle<TData extends RowData>({
	column,
	withBorder = false,
}: {
	column: Column<TData>;
	withBorder?: boolean;
}): React.CSSProperties {
	const isPinned = column.getIsPinned();
	const isLastLeftPinnedColumn =
		isPinned === 'start' && column.getIsLastColumn('start');
	const isFirstRightPinnedColumn =
		isPinned === 'end' && column.getIsFirstColumn('end');

	return {
		boxShadow: withBorder
			? isLastLeftPinnedColumn
				? '-4px 0 4px -4px var(--border) inset'
				: isFirstRightPinnedColumn
					? '4px 0 4px -4px var(--border) inset'
					: undefined
			: undefined,
		left: isPinned === 'start' ? `${column.getStart('start')}px` : undefined,
		right:
			isPinned === 'end'
				? `calc(${column.getAfter('end')}px - 1px)`
				: undefined,
		opacity: 1,
		position: isPinned ? 'sticky' : 'relative',
		background: isPinned ? 'var(--background)' : undefined,
		width: column.getSize(),
		zIndex: isPinned ? 1 : undefined,
	};
}

export function getFilterOperators(filterVariant: FilterVariant) {
	const operatorMap: Record<
		FilterVariant,
		{ label: string; value: FilterOperator }[]
	> = {
		text: dataTableConfig.textOperators,
		number: dataTableConfig.numericOperators,
		range: dataTableConfig.numericOperators,
		date: dataTableConfig.dateOperators,
		dateRange: dataTableConfig.dateOperators,
		boolean: dataTableConfig.booleanOperators,
		select: dataTableConfig.selectOperators,
		multiSelect: dataTableConfig.multiSelectOperators,
	};

	return operatorMap[filterVariant] ?? dataTableConfig.textOperators;
}

export function getDefaultFilterOperator(filterVariant: FilterVariant) {
	const operators = getFilterOperators(filterVariant);

	return operators[0]?.value ?? (filterVariant === 'text' ? 'iLike' : 'eq');
}

export function getValidFilters<TData>(
	filters: ExtendedColumnFilter<TData>[]
): ExtendedColumnFilter<TData>[] {
	return filters.filter(
		(filter) =>
			filter.operator === 'isEmpty' ||
			filter.operator === 'isNotEmpty' ||
			(Array.isArray(filter.value)
				? filter.value.length > 0
				: filter.value !== '' &&
					filter.value !== null &&
					filter.value !== undefined)
	);
}
