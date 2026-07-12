'use client';

import { canAccessArea } from '@md-oss/authz';
import {
  UserButton,
  type UserButtonProps,
} from '@md-oss/design-system/components/auth/user/user-button';
import { LayoutDashboardIcon } from 'lucide-react';
import { authClient } from '@/lib/client/auth';

const adminDashboardLink = {
  href: '/admin',
  icon: <LayoutDashboardIcon className="text-muted-foreground" />,
  label: 'Admin dashboard',
};

export function AppUserButton({ links, ...props }: UserButtonProps) {
  const { data: session } = authClient.useSession();

  const dashboardLinks =
    session && canAccessArea(session.actor.roles, 'admin.dashboard')
      ? [adminDashboardLink, ...(links ?? [])]
      : links;

  return <UserButton {...props} links={dashboardLinks} />;
}
