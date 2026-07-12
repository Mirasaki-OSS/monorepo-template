import type { UserView } from '@md-oss/api/types';
import { ActionBar } from '@md-oss/design-system/components/ui/action-bar';
import { Button } from '@md-oss/design-system/components/ui/button';
import type { Table } from '@md-oss/design-system/types/data-table';
import React from 'react';

export function UserTableActionBar({
  table,
  isMutating,
  onDeleteSelected,
}: {
  table: Table<UserView>;
  isMutating: boolean;
  onDeleteSelected: (users: UserView[]) => void;
}) {
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
        <Button
          variant="destructive"
          size="sm"
          disabled={isMutating || rows.length === 0}
          onClick={() => onDeleteSelected(rows.map((row) => row.original))}
        >
          Delete Selected
        </Button>
        <span className="text-sm text-muted-foreground">
          {rows.length} selected
        </span>
      </div>
    </ActionBar>
  );
}
