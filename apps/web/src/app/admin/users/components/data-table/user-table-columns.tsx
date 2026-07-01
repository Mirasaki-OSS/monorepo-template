import type { UserView } from '@md-oss/api/types';
import { UserAvatar } from '@md-oss/design-system/components/auth/user/user-avatar';
import { DataTableColumnHeader } from '@md-oss/design-system/components/data-table/data-table-column-header';
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
import type {
  ColumnDef,
  ColumnMeta,
} from '@md-oss/design-system/types/data-table';
import {
  CheckCircle,
  MoreHorizontal,
  Text,
  Verified,
  XCircle,
} from 'lucide-react';
import { columnMeta } from '@/app/admin/components/data-table';
import { formatAuthMethodLabel, getAuthMethodBadgeConfig } from '../helpers';

export type UserColumnMeta = ColumnMeta<UserView, UserView>;

export const userColumnMeta = (meta: UserColumnMeta) => columnMeta(meta);

export const userColumns = ({
  authMethodOptions,
  openEditDialog,
}: {
  authMethodOptions: Array<{ label: string; value: string }>;
  openEditDialog: (user: UserView) => void;
}): ColumnDef<UserView>[] =>
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
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
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
          return <p className="text-xs text-muted-foreground italic">None</p>;
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
      cell: ({ row }) => {
        const targetUser = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(targetUser)}>
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem>Impersonate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ] satisfies ColumnDef<UserView>[];
