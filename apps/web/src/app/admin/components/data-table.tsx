import type { UserView } from '@md-oss/api/types';
import { UserAvatar } from '@md-oss/design-system/components/auth/user/user-avatar';
import { DataTable } from '@md-oss/design-system/components/data-table/data-table';
import { DataTableColumnHeader } from '@md-oss/design-system/components/data-table/data-table-column-header';
import { DataTableFilterList } from '@md-oss/design-system/components/data-table/data-table-filter-list';
import { DataTableSortList } from '@md-oss/design-system/components/data-table/data-table-sort-list';
import { DataTableToolbar } from '@md-oss/design-system/components/data-table/data-table-toolbar';
import { ActionBar } from '@md-oss/design-system/components/ui/action-bar';
import { Badge } from '@md-oss/design-system/components/ui/badge';
import { Button } from '@md-oss/design-system/components/ui/button';
import { Checkbox } from '@md-oss/design-system/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@md-oss/design-system/components/ui/dropdown-menu';
import { CopyButton } from '@md-oss/design-system/components/ui/extended/copy-button';
import { RelativeTimeCard } from '@md-oss/design-system/components/ui/relative-time-card';
import { useDataTable } from '@md-oss/design-system/hooks/use-data-table';
import type {
  ColumnDef,
  ColumnMeta,
  Table,
} from '@md-oss/design-system/types/data-table';
import {
  CheckCircle,
  Fingerprint,
  KeyRound,
  type LucideIcon,
  MoreHorizontal,
  ShieldCheck,
  Text,
  Verified,
  XCircle,
} from 'lucide-react';
import { parseAsJson, useQueryState } from 'nuqs';
import React from 'react';
import { DiscordIcon } from '@/lib/client/icons';

type MyDataTableProps = {
  data: UserView[];
  pageCount: number;
};

type AdvancedFilterItem = {
  id: string;
  value: unknown;
  variant: string;
  operator: string;
  filterId?: string;
};

const validateAdvancedFilters = (value: unknown) => {
  if (!Array.isArray(value)) return null;
  return value as AdvancedFilterItem[];
};

function QuickAdvancedFilters({
  authMethodOptions,
}: {
  authMethodOptions: Array<{ label: string; value: string }>;
}) {
  const [filters, setFilters] = useQueryState(
    'filters',
    parseAsJson(validateAdvancedFilters).withDefault([])
  );

  const setMultiSelectQuickFilter = React.useCallback(
    (id: 'status' | 'authMethods', value: string, variant: 'multiSelect') => {
      void setFilters((prev) => {
        const existing = prev.find((filter) => filter.id === id);

        if (!existing) {
          return [
            ...prev,
            {
              id,
              value: [value],
              variant,
              operator: 'inArray',
              filterId: `quick-${id}`,
            },
          ];
        }

        const currentValues = Array.isArray(existing.value)
          ? existing.value
          : [existing.value];

        const hasValue = currentValues.includes(value);
        const nextValues = hasValue
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value];

        if (nextValues.length === 0) {
          return prev.filter((filter) => filter.id !== id);
        }

        return prev.map((filter) =>
          filter.id === id
            ? {
                ...filter,
                value: nextValues,
                variant,
                operator: 'inArray',
              }
            : filter
        );
      });
    },
    [setFilters]
  );

  const hasMultiSelectFilterValue = React.useCallback(
    (id: 'status' | 'authMethods', value: string) => {
      const existing = filters.find((filter) => filter.id === id);
      if (!existing) {
        return false;
      }

      const values = Array.isArray(existing.value)
        ? existing.value
        : [existing.value];
      return values.includes(value);
    },
    [filters]
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Quick Filters:</span>
      {[
        { label: 'Verified', value: 'verified' },
        { label: 'Unverified', value: 'unverified' },
      ].map((item) => {
        const active = hasMultiSelectFilterValue('status', item.value);
        return (
          <Button
            key={item.value}
            size="sm"
            variant={active ? 'default' : 'outline'}
            className="h-7"
            onClick={() =>
              setMultiSelectQuickFilter('status', item.value, 'multiSelect')
            }
          >
            {item.label}
          </Button>
        );
      })}
      {authMethodOptions.map((item) => {
        const active = hasMultiSelectFilterValue('authMethods', item.value);
        return (
          <Button
            key={item.value}
            size="sm"
            variant={active ? 'default' : 'outline'}
            className="h-7"
            onClick={() =>
              setMultiSelectQuickFilter(
                'authMethods',
                item.value,
                'multiSelect'
              )
            }
          >
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}

function MyTableActionBar({ table }: { table: Table<UserView> }) {
  const rows = table.getFilteredSelectedRowModel().rows;

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        table.toggleAllRowsSelected(false);
      }
    },
    [table]
  );

  return (
    <ActionBar open={rows.length > 0} onOpenChange={onOpenChange}>
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm">
          Bulk Action
        </Button>
        <span className="text-sm text-muted-foreground">
          {rows.length} selected
        </span>
      </div>
    </ActionBar>
  );
}

/**
 * Avoids type down-casting in column definitions
 */
const columnMeta = (
  meta: ColumnMeta<UserView, UserView>
): ColumnMeta<UserView, UserView> => {
  return meta;
};

export const MyDataTable: React.FC<MyDataTableProps> = ({
  data,
  pageCount,
}) => {
  const formatAuthMethodLabel = React.useCallback((method: string) => {
    return method
      .split(/[-_\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }, []);

  const getAuthMethodBadgeConfig = React.useCallback((method: string) => {
    const normalized = method.toLowerCase();

    if (normalized === 'password') {
      return {
        icon: KeyRound,
        className: 'border-amber-300/60 bg-amber-50 text-amber-700',
      };
    }

    if (normalized === 'passkey') {
      return {
        icon: Fingerprint,
        className: 'border-emerald-300/60 bg-emerald-50 text-emerald-700',
      };
    }

    if (normalized === 'discord') {
      return {
        icon: DiscordIcon as LucideIcon,
        className: 'border-indigo-300/60 bg-indigo-50 text-indigo-700',
      };
    }

    return {
      icon: ShieldCheck,
      className: 'border-cyan-300/60 bg-cyan-50 text-cyan-700',
    };
  }, []);

  const authMethodOptions = React.useMemo(() => {
    return Array.from(new Set(data.flatMap((row) => row.authMethods ?? [])))
      .sort((a, b) => a.localeCompare(b))
      .map((method) => {
        const badgeConfig = getAuthMethodBadgeConfig(method);

        return {
          label: formatAuthMethodLabel(method),
          value: method,
          icon: badgeConfig.icon,
        };
      });
  }, [data, formatAuthMethodLabel, getAuthMethodBadgeConfig]);

  const quickAuthMethodOptions = React.useMemo(() => {
    return authMethodOptions.map((option) => ({
      label: option.label,
      value: option.value,
    }));
  }, [authMethodOptions]);

  const columns: ColumnDef<UserView>[] = React.useMemo(
    () =>
      [
        {
          id: 'select',
          size: 27,
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        },
        {
          id: 'query',
          size: 200,
          accessorKey: 'name',
          accessorFn: (row) => row.name,
          header: ({ column }) => (
            <DataTableColumnHeader column={column} label="User" />
          ),
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <UserAvatar user={row.original} />
              <span className="font-medium">{row.getValue('query')}</span>
              <CopyButton
                hideLabel
                text={row.original.email}
                aria-label={`Copy email for ${row.original.name}`}
              />
            </div>
          ),
          meta: columnMeta({
            label: 'User',
            placeholder: 'Search users...',
            variant: 'text',
            icon: Text,
          }),
          enableColumnFilter: true,
          enableSorting: true,
          enableResizing: true,
          enableHiding: true,
          enableGrouping: true,
          enablePinning: true,
          enableMultiSort: true,
          enableGlobalFilter: true,
          getGroupingValue(row) {
            return row.name[0]; // Group by the first letter of the name
          },
        },
        {
          id: 'email',
          size: 250,
          accessorKey: 'email',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} label="Email (Verified)" />
          ),
          cell: ({ getValue, row }) => {
            const value = getValue() as string;
            const emailVerified = row.original.emailVerified;
            return (
              <div className="flex items-center gap-1">
                {emailVerified ? (
                  <Verified className="text-green-500 shrink-0" size={16} />
                ) : (
                  <XCircle className="text-red-500 shrink-0" size={16} />
                )}
                <span className="text-xs text-muted-foreground">{value}</span>
              </div>
            );
          },
          meta: {
            label: 'Email',
          },
          enableColumnFilter: true,
          enableSorting: true,
        },
        {
          id: 'id',
          size: 32,
          accessorKey: 'id',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} label="User ID" />
          ),
          cell: ({ getValue }) => {
            const value = getValue() as string;
            return (
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground max-w-16 truncate">
                  {value}
                </span>
                <CopyButton
                  hideLabel
                  text={value}
                  aria-label={`Copy user ID ${value}`}
                />
              </div>
            );
          },
          meta: {
            label: 'User ID',
          },
          enableColumnFilter: true,
          enableSorting: true,
        },
        {
          id: 'authMethods',
          size: 220,
          accessorFn: (row) => row.authMethods,
          header: ({ column }) => (
            <DataTableColumnHeader column={column} label="Auth Methods" />
          ),
          cell: ({ row }) => {
            const methods = row.original.authMethods ?? [];

            if (!methods.length) {
              return (
                <p className="text-xs text-muted-foreground italic">None</p>
              );
            }

            return (
              <div className="flex flex-wrap items-center gap-1.5">
                {methods.map((method) => {
                  const badgeConfig = getAuthMethodBadgeConfig(method);

                  const Icon = badgeConfig.icon;

                  return (
                    <Badge
                      key={`${row.original.id}-${method}`}
                      variant="outline"
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badgeConfig.className} select-none`}
                    >
                      <Icon className="size-3.5" />
                      {formatAuthMethodLabel(method)}
                    </Badge>
                  );
                })}
              </div>
            );
          },
          meta: {
            label: 'Auth Methods',
            variant: 'multiSelect',
            options: authMethodOptions,
          },
          enableColumnFilter: true,
          enableSorting: true,
        },
        {
          id: 'lastSeenAt',
          size: 50,
          accessorKey: 'lastSeenAt',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} label="Last Active" />
          ),
          cell: ({ getValue }) => {
            const value = getValue() as string | null;
            return value ? (
              <RelativeTimeCard
                date={new Date(value)}
                variant={'muted'}
                className="text-xs text-blue-400 hover:text-blue-700"
                timezones={[
                  'America/Los_Angeles', // NA West
                  'America/New_York', // NA East
                  'Europe/Amsterdam', // EU Central
                  // [DEV] Add user's timezone here once tracked
                ]}
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">Never seen</p>
            );
          },
          meta: {
            label: 'Last Active',
          },
          enableColumnFilter: true,
          enableSorting: true,
        },
        {
          id: 'createdAt',
          size: 50,
          accessorKey: 'createdAt',
          header: ({ column }) => (
            <DataTableColumnHeader column={column} label="Signed Up" />
          ),
          cell: ({ getValue }) => {
            const value = getValue() as string | null;
            return value ? (
              <RelativeTimeCard
                date={new Date(value)}
                variant={'muted'}
                className="text-xs text-blue-400 hover:text-blue-700"
                timezones={[
                  'America/Los_Angeles', // NA West
                  'America/New_York', // NA East
                  'Europe/Amsterdam', // EU Central
                  // [DEV] Add user's timezone here once tracked
                ]}
              />
            ) : (
              <p className="text-xs text-muted-foreground italic">Never seen</p>
            );
          },
          meta: {
            label: 'Signed Up',
          },
          enableColumnFilter: true,
          enableSorting: true,
        },
        {
          id: 'status',
          size: 120,
          accessorFn: (row) => (row.emailVerified ? 'verified' : 'unverified'),
          header: ({ column }) => (
            <DataTableColumnHeader column={column} label="Status" />
          ),
          cell: ({ cell }) => {
            const status = cell.getValue() as string;
            const Icon = status === 'verified' ? Verified : XCircle;

            return (
              <Badge variant="outline" className="capitalize">
                <Icon />
                {status}
              </Badge>
            );
          },
          meta: {
            label: 'Status',
            variant: 'multiSelect',
            options: [
              { label: 'Verified', value: 'verified', icon: CheckCircle },
              { label: 'Unverified', value: 'unverified', icon: XCircle },
            ],
          },
          enableColumnFilter: true,
        },
        {
          id: 'actions',
          size: 32,
          minSize: 32,
          maxSize: 32,
          header: () => <span className="sr-only">Actions</span>,
          cell: function Cell() {
            return (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem>Impersonate</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive">
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          },
        },
      ] satisfies ColumnDef<UserView>[],
    [authMethodOptions, formatAuthMethodLabel, getAuthMethodBadgeConfig]
  );

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: 'createdAt', desc: true }],
      pagination: { pageSize: 10, pageIndex: 0 },
      columnPinning: { left: ['select'], right: ['actions'] },
      columnVisibility: { status: false },
    },
    getRowId: (row) => row.id,
  });

  return (
    <div className="data-table-container">
      <DataTable
        table={table}
        actionBar={<MyTableActionBar table={table} />}
        useZebraColors
      >
        <DataTableToolbar table={table}>
          <DataTableFilterList table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <QuickAdvancedFilters authMethodOptions={quickAuthMethodOptions} />
        </div>
      </DataTable>
    </div>
  );
};
