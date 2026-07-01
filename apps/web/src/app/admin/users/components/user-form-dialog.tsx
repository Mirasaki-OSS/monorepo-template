import { zodResolver } from '@hookform/resolvers/zod';
import type { ClientAuthContext, UserView } from '@md-oss/api/types';
import { createEmptyUser, userViewSchema } from '@md-oss/api/types';
import { titleCase } from '@md-oss/common/utils/strings';
import { UserAvatar } from '@md-oss/design-system/components/auth/user/user-avatar';
import { Badge } from '@md-oss/design-system/components/ui/badge';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@md-oss/design-system/components/ui/responsive-dialog';
import { cn } from '@md-oss/design-system/lib/utils';
import React from 'react';
import { useForm } from 'react-hook-form';
import { UserForm, UserFormControlButtons } from './user-forms';

export type UserBannerProps = {
  user: UserView;
};

export const UserBanner = ({ user }: UserBannerProps) => {
  const variant =
    user.primaryRole === 'owner' || user.primaryRole === 'admin'
      ? 'destructive'
      : user.primaryRole === 'support'
        ? 'default'
        : 'secondary';
  const backgroundClassNames =
    user.primaryRole === 'owner' || user.primaryRole === 'admin'
      ? 'bg-destructive/10'
      : user.primaryRole === 'support'
        ? 'bg-primary/10'
        : 'bg-secondary/10';
  const borderClassNames =
    user.primaryRole === 'owner' || user.primaryRole === 'admin'
      ? 'border-destructive'
      : user.primaryRole === 'support'
        ? 'border-primary'
        : 'border-secondary';
  return (
    <div
      className={cn(
        `flex items-center justify-between rounded-lg border-2 p-3`,
        backgroundClassNames,
        borderClassNames
      )}
    >
      <div className="flex items-center gap-3">
        <UserAvatar user={user} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <Badge
        variant={user.emailVerified ? variant : 'outline'}
        className="capitalize"
      >
        {user.primaryRole === 'user'
          ? user.emailVerified
            ? 'Verified'
            : 'Unverified'
          : titleCase(user.primaryRole)}
      </Badge>
    </div>
  );
};

export type UserFormDialogProps = {
  className?: string;
  open: boolean;
  auth: ClientAuthContext | null;
  onOpenChange: (open: boolean) => void;
  user: UserView | null;
  isLoading?: boolean;
  onCreate?: (payload: { value: UserView }) => void | Promise<void>;
  onUpdate?: (payload: {
    userId: string;
    value: UserView;
  }) => void | Promise<void>;
};

export const UserFormDialog = ({
  className,
  open,
  auth,
  onOpenChange,
  user,
  isLoading = false,
  onCreate,
  onUpdate,
}: UserFormDialogProps) => {
  const form = useForm({
    mode: 'onChange',
    resolver: zodResolver(userViewSchema),
    defaultValues: user ?? createEmptyUser(),
  });

  async function onSubmit(data: UserView) {
    if (user) {
      await onUpdate?.({ userId: user.id, value: data });
    } else {
      await onCreate?.({ value: data });
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: We only want to reset when the user ID changes, not when other properties change
  React.useEffect(() => {
    if (open && user) {
      form.reset(user ?? createEmptyUser());
    }
  }, [user?.id]);

  const handleClose = React.useCallback(
    (open: boolean) => {
      if (!open && !isLoading) {
        form.reset();
      }
      onOpenChange(open);
    },
    [isLoading, form, onOpenChange]
  );

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent className={cn('sm:max-w-2xl', className)}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Edit User</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Update profile details and account metadata for this user.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {user ? (
          <div className="space-y-4">
            <UserBanner user={user} />

            <UserForm
              form={form}
              auth={auth}
              value={form.watch()}
              onSubmit={onSubmit}
              disabled={isLoading}
              pieceProps={{ showDescription: true }}
            />

            <UserFormControlButtons
              form={form}
              disabled={isLoading}
              content={{
                submit: isLoading
                  ? 'Saving...'
                  : user
                    ? 'Update User'
                    : 'Create User',
              }}
            />
          </div>
        ) : null}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
