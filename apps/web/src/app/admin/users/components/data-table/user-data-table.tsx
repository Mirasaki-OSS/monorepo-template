import type { ClientAuthContext, UserView } from '@md-oss/api/types';
import { DataTable } from '@md-oss/design-system/components/data-table/data-table';
import { DataTableFilterList } from '@md-oss/design-system/components/data-table/data-table-filter-list';
import { DataTableSkeleton } from '@md-oss/design-system/components/data-table/data-table-skeleton';
import { DataTableSortList } from '@md-oss/design-system/components/data-table/data-table-sort-list';
import { DataTableToolbar } from '@md-oss/design-system/components/data-table/data-table-toolbar';
import { useDataTable } from '@md-oss/design-system/hooks/use-data-table';
import type { ColumnDef, Table } from '@md-oss/design-system/types/data-table';
import React from 'react';
import { resolveAuthMethodOptions } from '../helpers';
import { UserFormDialog } from '../user-form-dialog';
import { QuickAdvancedUserFilters } from './user-quick-actions';
import { UserTableActionBar } from './user-table-action-bar';
import { userColumns } from './user-table-columns';

type UserDataTableProps = {
  data: UserView[];
  pageCount: number;
  auth: ClientAuthContext | null;
  RefreshButton: React.FC;
  isLoading: boolean;
};

export const UserDataTableSkeleton = ({
  table,
  RefreshButton,
  authMethodOptions,
  columns,
  pageCount,
}: {
  table: Table<UserView>;
  RefreshButton: React.FC;
  authMethodOptions: Array<{ label: string; value: string }>;
  columns: ColumnDef<UserView>[];
  pageCount: number;
}) => {
  return (
    <div className="data-table-container">
      <DataTableToolbar table={table} afterViewOptions={<RefreshButton />}>
        <DataTableFilterList table={table} />
        <DataTableSortList table={table} />
      </DataTableToolbar>
      <div className="flex flex-1 flex-wrap items-center gap-2 mt-2.5">
        <QuickAdvancedUserFilters authMethodOptions={authMethodOptions} />
      </div>
      <DataTableSkeleton
        columnCount={columns.length}
        rowCount={pageCount}
        withViewOptions={false}
      />
    </div>
  );
};

export const UserDataTable: React.FC<UserDataTableProps> = ({
  data,
  pageCount,
  isLoading: initialLoading,
  auth,
  RefreshButton,
}) => {
  const [isLoading, setIsLoading] = React.useState(initialLoading);
  const [editingUser, setEditingUser] = React.useState<UserView | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(initialLoading);
  }, [initialLoading]);

  const openEditDialog = React.useCallback((targetUser: UserView) => {
    setEditingUser(targetUser);
    setIsEditDialogOpen(true);
  }, []);

  const handleEditDialogOpenChange = React.useCallback((open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingUser(null);
    }
  }, []);

  const authMethodOptions = resolveAuthMethodOptions({ data });

  const columns = React.useMemo(
    () => userColumns({ authMethodOptions, openEditDialog }),
    [authMethodOptions, openEditDialog]
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

  const onCreate = React.useCallback(async ({ value }: { value: UserView }) => {
    setIsLoading(true);
    try {
      // Call API to create user
      console.log('Creating user with data:', value);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onUpdate = React.useCallback(
    async ({ userId, value }: { userId: string; value: UserView }) => {
      setIsLoading(true);
      try {
        // Call API to update user
        console.log(`Updating user ${userId} with data:`, value);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error updating user:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <UserDataTableSkeleton
        table={table}
        RefreshButton={RefreshButton}
        authMethodOptions={authMethodOptions}
        columns={columns}
        pageCount={pageCount}
      />
    );
  }

  return (
    <div className="data-table-container">
      <DataTable
        table={table}
        actionBar={<UserTableActionBar table={table} />}
        useZebraColors
      >
        <DataTableToolbar table={table} afterViewOptions={<RefreshButton />}>
          <DataTableFilterList table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <QuickAdvancedUserFilters authMethodOptions={authMethodOptions} />
        </div>
      </DataTable>

      <UserFormDialog
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogOpenChange}
        user={editingUser}
        auth={auth}
        isLoading={isLoading}
        onCreate={onCreate}
        onUpdate={onUpdate}
      />
    </div>
  );
};
