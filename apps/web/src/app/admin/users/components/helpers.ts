import type { UserView } from '@md-oss/api/types';
import {
  authzRoles,
  permissionsForRoles,
  rolePermissions,
} from '@md-oss/authz';

import {
  Fingerprint,
  KeyRound,
  type LucideIcon,
  ShieldCheck,
} from 'lucide-react';
import { DiscordIcon } from '@/lib/client/icons';

export const formatAuthMethodLabel = (method: string) => {
  return method
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const getAuthMethodBadgeConfig = (method: string) => {
  const normalized = method.toLowerCase();

  if (normalized === 'password') {
    return {
      icon: KeyRound,
      className: 'border-amber-300/60 bg-amber-50 text-amber-700',
    };
  }

  if (normalized === 'passkey') {
    return {
      icon: Fingerprint,
      className: 'border-emerald-300/60 bg-emerald-50 text-emerald-700',
    };
  }

  if (normalized === 'discord') {
    return {
      icon: DiscordIcon as LucideIcon,
      className: 'border-indigo-300/60 bg-indigo-50 text-indigo-700',
    };
  }

  return {
    icon: ShieldCheck,
    className: 'border-cyan-300/60 bg-cyan-50 text-cyan-700',
  };
};

export const resolveAuthMethodOptions = ({ data }: { data: UserView[] }) => {
  return Array.from(new Set(data.flatMap((row) => row.authMethods ?? [])))
    .sort((a, b) => a.localeCompare(b))
    .map((method) => {
      const badgeConfig = getAuthMethodBadgeConfig(method);

      return {
        label: formatAuthMethodLabel(method),
        value: method,
        icon: badgeConfig.icon,
      };
    });
};

export const resolveRoleOptions = () => {
  return authzRoles.map((role) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    value: role,
  }));
};

export const toPermissionKey = ({
  action,
  subject,
  scope,
}: {
  action: string;
  subject: string;
  scope: string;
}) => `${action}:${subject}:${scope}`;

export const formatPermissionLabel = (permissionKey: string) => {
  const [action, subject, scope] = permissionKey.split(':');
  if (!action || !subject || !scope) {
    return permissionKey;
  }

  return `${action.toUpperCase()} ${subject} (${scope})`;
};

export const resolvePermissionOptions = () => {
  const permissionKeys = Array.from(
    new Set(
      Object.values(rolePermissions)
        .flat()
        .map((permission) =>
          toPermissionKey({
            action: permission.action,
            subject: permission.subject,
            scope: permission.scope,
          })
        )
    )
  ).sort((a, b) => a.localeCompare(b));

  return permissionKeys.map((value) => ({
    label: formatPermissionLabel(value),
    value,
  }));
};

export const resolveUserPermissionKeys = (user: UserView) => {
  return permissionsForRoles(user.roles)
    .map((permission) =>
      toPermissionKey({
        action: permission.action,
        subject: permission.subject,
        scope: permission.scope,
      })
    )
    .sort((a, b) => a.localeCompare(b));
};
