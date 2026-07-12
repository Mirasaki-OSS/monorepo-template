'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@md-oss/design-system/components/ui/breadcrumb';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@md-oss/design-system/components/ui/sidebar';
import { cn } from '@md-oss/design-system/lib/utils';
import { HomeIcon, LayoutDashboardIcon, UsersIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { AppUserButton } from '@/components/user-button';
import pkg from '../../../../package.json';

type AdminSidebarLayoutProps = {
  children: React.ReactNode;
};

type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const adminNavItems: AdminNavItem[] = [
  {
    href: '/admin',
    label: 'Overview',
    icon: LayoutDashboardIcon,
  },
  {
    href: '/admin/users',
    label: 'Users',
    icon: UsersIcon,
  },
];

export function AdminSidebarLayout({ children }: AdminSidebarLayoutProps) {
  const pathname = usePathname();
  const activeItem = adminNavItems.find((item) =>
    item.href === '/'
      ? pathname === '/'
      : item.href === '/admin'
        ? pathname === '/admin'
        : pathname.startsWith(item.href)
  );
  const currentPageLabel = activeItem?.label ?? 'Overview';

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2 text-sidebar-foreground/80">
              Dashboard
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/'
                      ? pathname === '/'
                      : item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <Icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarMenu className="mt-auto mb-2">
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <HomeIcon className="size-4" />
                  <span>Go Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <div className="flex flex-col gap-2 px-2 py-1">
            <div className="text-xs text-sidebar-foreground/60">
              Admin Console v{pkg.version}
            </div>
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header
          className={cn(
            'sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur'
          )}
        >
          <SidebarTrigger />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPageLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto">
            <AppUserButton size="icon" />
          </div>
        </header>

        <div className="p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
