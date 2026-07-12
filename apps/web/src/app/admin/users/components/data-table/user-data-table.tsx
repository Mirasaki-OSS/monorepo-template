import type {
  ClientAuthContext,
  UpdateUserByIdInput,
  UserView,
} from '@md-oss/api/types';
import { getErrorMessage } from '@md-oss/common';
import { DataTable } from '@md-oss/design-system/components/data-table/data-table';
import { DataTableFilterList } from '@md-oss/design-system/components/data-table/data-table-filter-list';
import { DataTableSkeleton } from '@md-oss/design-system/components/data-table/data-table-skeleton';
import { DataTableSortList } from '@md-oss/design-system/components/data-table/data-table-sort-list';
import { DataTableToolbar } from '@md-oss/design-system/components/data-table/data-table-toolbar';
import { ConfirmationDialog } from '@md-oss/design-system/components/state/confirmation-dialog';
import { useConfirmationStore } from '@md-oss/design-system/hooks/use-confirmation-store';
import { useDataTable } from '@md-oss/design-system/hooks/use-data-table';
import type { ColumnDef, Table } from '@md-oss/design-system/types/data-table';
import React from 'react';
import { toast } from 'sonner';
import { useTRPCClient } from '@/lib/client/trpc';
import {
  resolveAuthMethodOptions,
  resolvePermissionOptions,
  resolveRoleOptions,
} from '../helpers';
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
  onRefresh?: () => Promise<void> | void;
};

export const UserDataTableSkeleton = ({
  table,
  RefreshButton,
  authMethodOptions,
  roleOptions,
  permissionOptions,
  columns,
  pageCount,
}: {
  table: Table<UserView>;
  RefreshButton: React.FC;
  authMethodOptions: Array<{ label: string; value: string }>;
  roleOptions: Array<{ label: string; value: string }>;
  permissionOptions: Array<{ label: string; value: string }>;
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
        <QuickAdvancedUserFilters
          authMethodOptions={authMethodOptions}
          roleOptions={roleOptions}
          permissionOptions={permissionOptions}
        />
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
  onRefresh,
}) => {
  const trpcClient = useTRPCClient();
  const { openConfirmation } = useConfirmationStore();
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

  const deleteUsers = React.useCallback(
    async (targetUsers: UserView[]) => {
      if (targetUsers.length === 0) {
        return;
      }

      setIsLoading(true);
      try {
        const results = await Promise.allSettled(
          targetUsers.map((targetUser) =>
            trpcClient.users.deleteById.mutate({
              id: targetUser.id,
              confirm: 'DELETE',
            })
          )
        );

        const successCount = results.filter(
          (result) => result.status === 'fulfilled'
        ).length;
        const failed = results.filter(
          (result) => result.status === 'rejected'
        ) as PromiseRejectedResult[];

        if (successCount > 0) {
          toast.success(
            successCount === 1
              ? 'User deleted successfully.'
              : `${successCount} users deleted successfully.`
          );
        }

        if (failed.length > 0) {
          toast.error(
            `Failed to delete ${failed.length} user${failed.length > 1 ? 's' : ''}: ${getErrorMessage(failed[0].reason)}`
          );
        }

        if (
          editingUser &&
          targetUsers.some((user) => user.id === editingUser.id)
        ) {
          setIsEditDialogOpen(false);
          setEditingUser(null);
        }

        await onRefresh?.();
      } finally {
        setIsLoading(false);
      }
    },
    [editingUser, onRefresh, trpcClient.users.deleteById]
  );

  const requestDeleteConfirmation = React.useCallback(
    (targetUsers: UserView[]) => {
      if (targetUsers.length === 0) {
        return;
      }

      const description =
        targetUsers.length === 1
          ? `This action cannot be undone. ${targetUsers[0]?.email ?? targetUsers[0]?.id} will be permanently removed.`
          : `This action cannot be undone. ${targetUsers.length} selected users will be permanently removed.`;

      openConfirmation({
        title:
          targetUsers.length === 1 ? 'Delete user' : 'Delete selected users',
        description,
        actionLabel:
          targetUsers.length === 1
            ? 'Delete user'
            : `Delete ${targetUsers.length} users`,
        cancelLabel: 'Cancel',
        actionProps: { variant: 'destructive' },
        onAction: () => {
          void deleteUsers(targetUsers);
        },
        onCancel: () => {},
      });
    },
    [deleteUsers, openConfirmation]
  );

  const handleDeleteUser = React.useCallback(
    (targetUser: UserView) => {
      requestDeleteConfirmation([targetUser]);
    },
    [requestDeleteConfirmation]
  );

  const handleBulkDeleteUsers = React.useCallback(
    (targetUsers: UserView[]) => {
      requestDeleteConfirmation(targetUsers);
    },
    [requestDeleteConfirmation]
  );

  const normalizeEmptyToNull = React.useCallback((value: string | null) => {
    if (value == null) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length === 0 ? null : normalized;
  }, []);

  const areStringArraysEqual = React.useCallback(
    (left: readonly string[], right: readonly string[]) => {
      if (left.length !== right.length) {
        return false;
      }

      const leftSorted = [...left].sort();
      const rightSorted = [...right].sort();
      return leftSorted.every((value, index) => value === rightSorted[index]);
    },
    []
  );

  const isObjectLikeEqual = React.useCallback(
    (
      left: Record<string, unknown> | null,
      right: Record<string, unknown> | null
    ) => JSON.stringify(left) === JSON.stringify(right),
    []
  );

  const buildUpdatePatch = React.useCallback(
    (
      currentUser: UserView,
      nextValue: UserView
    ): UpdateUserByIdInput['data'] => {
      const patch: UpdateUserByIdInput['data'] = {};

      if (nextValue.name !== currentUser.name) {
        patch.name = nextValue.name;
      }

      const currentImage = normalizeEmptyToNull(currentUser.image);
      const nextImage = normalizeEmptyToNull(nextValue.image);
      if (nextImage !== currentImage) {
        patch.image = nextImage;
      }

      const currentUsername = normalizeEmptyToNull(currentUser.username);
      const nextUsername = normalizeEmptyToNull(nextValue.username);
      if (nextUsername !== currentUsername) {
        patch.username = nextUsername;
      }

      const currentDisplayUsername = normalizeEmptyToNull(
        currentUser.displayUsername
      );
      const nextDisplayUsername = normalizeEmptyToNull(
        nextValue.displayUsername
      );
      if (nextDisplayUsername !== currentDisplayUsername) {
        patch.displayUsername = nextDisplayUsername;
      }

      const currentBio = normalizeEmptyToNull(currentUser.bio);
      const nextBio = normalizeEmptyToNull(nextValue.bio);
      if (nextBio !== currentBio) {
        patch.bio = nextBio;
      }

      if (!areStringArraysEqual(currentUser.roles, nextValue.roles)) {
        patch.roles = [...nextValue.roles];
      }

      if (nextValue.banned !== currentUser.banned) {
        patch.banned = nextValue.banned;
      }

      const currentBanReason = normalizeEmptyToNull(currentUser.banReason);
      const nextBanReason = normalizeEmptyToNull(nextValue.banReason);
      if (nextBanReason !== currentBanReason) {
        patch.banReason = nextBanReason;
      }

      const currentBanExpiresAt = currentUser.banExpiresAt?.getTime() ?? null;
      const nextBanExpiresAt = nextValue.banExpiresAt?.getTime() ?? null;
      if (nextBanExpiresAt !== currentBanExpiresAt) {
        patch.banExpiresAt = nextValue.banExpiresAt ?? null;
      }

      if (
        !isObjectLikeEqual(currentUser.clientMetadata, nextValue.clientMetadata)
      ) {
        patch.clientMetadata = nextValue.clientMetadata;
      }

      if (
        !isObjectLikeEqual(
          currentUser.clientReadonlyMetadata,
          nextValue.clientReadonlyMetadata
        )
      ) {
        patch.clientReadonlyMetadata = nextValue.clientReadonlyMetadata;
      }

      if (
        !isObjectLikeEqual(currentUser.serverMetadata, nextValue.serverMetadata)
      ) {
        patch.serverMetadata = nextValue.serverMetadata;
      }

      return patch;
    },
    [areStringArraysEqual, isObjectLikeEqual, normalizeEmptyToNull]
  );

  const authMethodOptions = resolveAuthMethodOptions({ data });
  const roleOptions = resolveRoleOptions();
  const permissionOptions = resolvePermissionOptions();

  const columns = React.useMemo(
    () =>
      userColumns({
        authMethodOptions,
        roleOptions,
        permissionOptions,
        openEditDialog,
        onDeleteUser: handleDeleteUser,
        isMutating: isLoading,
      }),
    [
      authMethodOptions,
      handleDeleteUser,
      isLoading,
      openEditDialog,
      permissionOptions,
      roleOptions,
    ]
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
      if (!editingUser || editingUser.id !== userId) {
        toast.error('Unable to resolve the user being edited. Please retry.');
        return;
      }

      const patch = buildUpdatePatch(editingUser, value);
      if (Object.keys(patch).length === 0) {
        toast.info('No changes to save.');
        return;
      }

      setIsLoading(true);
      try {
        await trpcClient.users.updateById.mutate({
          id: userId,
          data: patch,
        });

        toast.success('User updated successfully.');
        setIsEditDialogOpen(false);
        setEditingUser(null);
        await onRefresh?.();
      } catch (error) {
        toast.error(`Failed to update user: ${getErrorMessage(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [buildUpdatePatch, editingUser, onRefresh, trpcClient.users.updateById]
  );

  if (isLoading) {
    return (
      <UserDataTableSkeleton
        table={table}
        RefreshButton={RefreshButton}
        authMethodOptions={authMethodOptions}
        roleOptions={roleOptions}
        permissionOptions={permissionOptions}
        columns={columns}
        pageCount={pageCount}
      />
    );
  }

  return (
    <div className="data-table-container">
      <DataTable
        table={table}
        actionBar={
          <UserTableActionBar
            table={table}
            isMutating={isLoading}
            onDeleteSelected={handleBulkDeleteUsers}
          />
        }
        useZebraColors
      >
        <DataTableToolbar table={table} afterViewOptions={<RefreshButton />}>
          <DataTableFilterList table={table} />
          <DataTableSortList table={table} />
        </DataTableToolbar>
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <QuickAdvancedUserFilters
            authMethodOptions={authMethodOptions}
            roleOptions={roleOptions}
            permissionOptions={permissionOptions}
          />
        </div>
      </DataTable>

      <UserFormDialog
        open={isEditDialogOpen}
        onOpenChange={handleEditDialogOpenChange}
        user={editingUser}
        auth={auth}
        isLoading={isLoading}
        onCreate={onCreate}
        onDelete={({ user }) => handleDeleteUser(user)}
        onUpdate={onUpdate}
      />
      <ConfirmationDialog />
    </div>
  );
};
