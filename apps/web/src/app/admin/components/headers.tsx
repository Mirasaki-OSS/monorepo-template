import { UserButton } from '@md-oss/design-system/components/auth/user/user-button';
import { cn } from '@md-oss/design-system/lib/utils';

export const AdminHeader = () => {
  return (
    <div
      className={cn(
        'w-full h-16 border-b flex items-center justify-between px-4'
      )}
    >
      <div className="text-sm text-muted-foreground mr-auto">
        Admin Dashboard
      </div>
      <UserButton size="icon" />
    </div>
  );
};
