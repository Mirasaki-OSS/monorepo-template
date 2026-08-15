import type {
	CellData,
	ColumnSort,
	ColumnVisibilityState,
	RowData,
	TableFeatures,
	Column as TanstackColumn,
	ColumnDef as TanstackColumnDef,
	ColumnMeta as TanstackColumnMeta,
	ReactTable as TanstackReactTable,
	Row as TanstackRow,
	TableMeta as TanstackTableMeta,
	TableOptions as TanstackTableOptions,
	TableState as TanstackTableState,
} from '@tanstack/react-table';
import type { DataTableConfig } from '../config/data-table';
import type { FilterItemSchema } from '../lib/parsers';

declare module '@tanstack/react-table' {
	// biome-ignore lint/correctness/noUnusedVariables: TData is used in the TableMeta interface
	interface TableMeta<TFeatures extends TableFeatures, TData extends RowData> {
		queryKeys?: QueryKeys;
	}

	// biome-ignore lint/correctness/noUnusedVariables: TData and TValue are used in the ColumnMeta interface
	interface ColumnMeta<
		TFeatures extends TableFeatures,
		TData extends RowData,
		TValue extends CellData = CellData,
	> {
		label?: string;
		placeholder?: string;
		variant?: FilterVariant;
		options?: Option[];
		range?: [number, number];
		unit?: string;
		icon?: React.FC<React.SVGProps<SVGSVGElement>>;
	}
}

export type Column<TData extends RowData, TValue = unknown> = TanstackColumn<
	TableFeatures,
	TData,
	TValue
>;

export type ColumnDef<
	TData extends RowData,
	TValue = unknown,
> = TanstackColumnDef<TableFeatures, TData, TValue>;

export type ColumnMeta<
	TData extends RowData,
	TValue = unknown,
> = TanstackColumnMeta<TableFeatures, TData, TValue>;

export type Row<TData extends RowData> = TanstackRow<TableFeatures, TData>;

export type Table<TData extends RowData> = TanstackReactTable<
	TableFeatures,
	TData
>;

export type TableMeta<TData extends RowData> = TanstackTableMeta<
	TableFeatures,
	TData
>;

export type TableOptions<TData extends RowData> = TanstackTableOptions<
	TableFeatures,
	TData
>;

export type TableState = TanstackTableState<TableFeatures>;

export type VisibilityState = ColumnVisibilityState;

export interface QueryKeys {
	page: string;
	perPage: string;
	sort: string;
	filters: string;
	joinOperator: string;
}

export interface Option {
	label: string;
	value: string;
	count?: number;
	icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

export type FilterOperator = DataTableConfig['operators'][number];
export type FilterVariant = DataTableConfig['filterVariants'][number];
export type JoinOperator = DataTableConfig['joinOperators'][number];

export interface ExtendedColumnSort<TData> extends Omit<ColumnSort, 'id'> {
	id: Extract<keyof TData, string>;
}

export interface ExtendedColumnFilter<TData> extends FilterItemSchema {
	id: Extract<keyof TData, string>;
}

export interface DataTableRowAction<TData extends RowData> {
	row: Row<TData>;
	variant: 'update' | 'delete';
}

export type { CellData, ColumnSort, RowData, TableFeatures };
