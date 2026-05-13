import { DataTablePagination } from '@md-oss/design-system/components/data-table/data-table-pagination';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@md-oss/design-system/components/ui/table';
import { getColumnPinningStyle } from '@md-oss/design-system/lib/data-table';
import { cn } from '@md-oss/design-system/lib/utils';
import { flexRender, type Table as TanstackTable } from '@tanstack/react-table';
import type * as React from 'react';

interface DataTableProps<TData> extends React.ComponentProps<'div'> {
	table: TanstackTable<TData>;
	actionBar?: React.ReactNode;
	useZebraColors?: boolean;
}

export function DataTable<TData>({
	table,
	actionBar,
	useZebraColors = false,
	children,
	className,
	...props
}: DataTableProps<TData>) {
	return (
		<div
			className={cn('flex w-full flex-col gap-2.5 overflow-auto', className)}
			{...props}
		>
			{children}
			<div className="overflow-hidden rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead
										key={header.id}
										colSpan={header.colSpan}
										style={{
											...getColumnPinningStyle({
												column: header.column,
												withBorder: true,
											}),
										}}
									>
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext()
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && 'selected'}
									className={cn(
										useZebraColors &&
											'odd:bg-muted/40 even:bg-background dark:odd:bg-muted/25 dark:even:bg-background hover:odd:bg-muted/50 hover:even:bg-muted/30 dark:hover:odd:bg-muted/35 dark:hover:even:bg-muted/20 data-[state=selected]:bg-muted'
									)}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											style={{
												...getColumnPinningStyle({
													column: cell.column,
													withBorder: true,
												}),
											}}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={table.getAllColumns().length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex flex-col gap-2.5">
				<DataTablePagination table={table} />
				{actionBar &&
					table.getFilteredSelectedRowModel().rows.length > 0 &&
					actionBar}
			</div>
		</div>
	);
}
