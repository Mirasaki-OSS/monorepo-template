'use client';

import type { ClientAuthContext } from '@md-oss/api/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@md-oss/design-system/components/ui/card';
import { cn } from '@md-oss/design-system/lib/utils';
import {
  ActivityIcon,
  ShieldIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';

export type AdminPageClientProps = {
  auth: ClientAuthContext;
  totals: {
    users: number;
  };
};

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
};

const StatCard = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}: StatCardProps) => (
  <Card className={cn('border-t-4 border-primary rounded-t-none', className)}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className="text-muted-foreground">{icon}</div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <span
            className={cn(
              'text-xs font-semibold',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '+' : '-'}
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function AdminPageClient({
  auth: _auth,
  totals,
}: AdminPageClientProps) {
  const stats = [
    {
      title: 'Total Users',
      value: totals.users,
      description: 'Registered accounts',
      icon: <UsersIcon className="h-5 w-5" />,
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Active Users',
      value: '2,847',
      description: 'Last 30 days',
      icon: <ActivityIcon className="h-5 w-5" />,
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Admin Users',
      value: '14',
      description: 'Administrative access',
      icon: <ShieldIcon className="h-5 w-5" />,
      trend: { value: 2, isPositive: true },
    },
    {
      title: 'Growth Rate',
      value: '23%',
      description: 'Month over month',
      icon: <TrendingUpIcon className="h-5 w-5" />,
      trend: { value: 4, isPositive: true },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* User Growth Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex items-end justify-between gap-2">
            {[
              { month: 'Jan', height: 65 },
              { month: 'Feb', height: 78 },
              { month: 'Mar', height: 82 },
              { month: 'Apr', height: 88 },
              { month: 'May', height: 92 },
              { month: 'Jun', height: 78 },
              { month: 'Jul', height: 85 },
              { month: 'Aug', height: 91 },
              { month: 'Sep', height: 88 },
              { month: 'Oct', height: 94 },
              { month: 'Nov', height: 96 },
              { month: 'Dec', height: 98 },
            ].map((item) => (
              <div
                key={item.month}
                className="flex-1 rounded-t-sm bg-linear-to-t from-primary to-primary/60 hover:from-primary/90 hover:to-primary/70 transition-all"
                style={{ height: `${item.height * 1.5}px` }}
              />
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                id: 'activity-1',
                action: 'User registered',
                time: '2 minutes ago',
                user: 'John Doe',
              },
              {
                id: 'activity-2',
                action: 'Admin added role',
                time: '15 minutes ago',
                user: 'Sarah Smith',
              },
              {
                id: 'activity-3',
                action: 'User deleted account',
                time: '1 hour ago',
                user: 'Mike Johnson',
              },
              {
                id: 'activity-4',
                action: 'Email verified',
                time: '2 hours ago',
                user: 'Emma Wilson',
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 pb-3 border-b last:border-b-0 last:pb-0"
              >
                <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.user}</p>
                </div>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {item.time}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* User Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Status</CardTitle>
            <CardDescription>Distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                id: 'status-verified',
                label: 'Verified',
                count: 3847,
                color: 'bg-green-500',
                percent: 92,
              },
              {
                id: 'status-pending',
                label: 'Pending',
                count: 284,
                color: 'bg-yellow-500',
                percent: 7,
              },
              {
                id: 'status-suspended',
                label: 'Suspended',
                count: 42,
                color: 'bg-red-500',
                percent: 1,
              },
            ].map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn('h-full', item.color)}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Role Distribution</CardTitle>
            <CardDescription>User roles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { id: 'role-user', role: 'User', count: 3762, percent: 90 },
              { id: 'role-support', role: 'Support', count: 251, percent: 6 },
              { id: 'role-admin', role: 'Admin', count: 140, percent: 3 },
              { id: 'role-owner', role: 'Owner', count: 20, percent: 1 },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{item.role}</span>
                <span className="text-muted-foreground">{item.count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Health</CardTitle>
            <CardDescription>Service status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                id: 'health-api',
                service: 'API',
                status: 'Operational',
                isHealthy: true,
              },
              {
                id: 'health-db',
                service: 'Database',
                status: 'Operational',
                isHealthy: true,
              },
              {
                id: 'health-cache',
                service: 'Cache',
                status: 'Operational',
                isHealthy: true,
              },
              {
                id: 'health-storage',
                service: 'Storage',
                status: 'Operational',
                isHealthy: true,
              },
            ].map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{item.service}</span>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'h-2 w-2 rounded-full',
                      item.isHealthy ? 'bg-green-500' : 'bg-red-500'
                    )}
                  />
                  <span className="text-xs text-muted-foreground">
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
