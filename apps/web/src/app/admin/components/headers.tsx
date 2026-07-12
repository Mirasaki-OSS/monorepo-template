import { cn } from '@md-oss/design-system/lib/utils';
import { AppUserButton } from '@/components/user-button';

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
      <AppUserButton size="icon" />
    </div>
  );
};
