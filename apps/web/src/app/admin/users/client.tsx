'use client';

import type {
  ClientAuthContext,
  ListUsersDefinitions,
  ListUsersInput,
} from '@md-oss/api/types';
import { HTTPErrorAlert } from '@md-oss/design-system/components/state/http-error-alert';
import { registerCodeBlockLanguage } from '@md-oss/design-system/components/ui/aceternity/code-block';
import { Button } from '@md-oss/design-system/components/ui/button';
import { generateId } from '@md-oss/design-system/lib/id';
import { getSortingStateParser } from '@md-oss/design-system/lib/parsers';
import { useQuery } from '@tanstack/react-query';
import { RefreshCwIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString,
  useQueryState,
} from 'nuqs';
import React from 'react';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import { useTRPC } from '@/lib/client/trpc';
import { UserDataTable } from './components/data-table/user-data-table';

registerCodeBlockLanguage('json', json);

export type AdminUsersPageClientProps = {
  auth: ClientAuthContext;
  definitions: ListUsersDefinitions;
};

export default function AdminUsersPageClient({
  auth,
  definitions,
}: AdminUsersPageClientProps) {
  const trpc = useTRPC();
  const router = useRouter();

  const sortableColumns = React.useMemo(() => {
    return new Set(definitions.sorting.sortableColumns);
  }, [definitions]);

  const defaultUsersListSorting = React.useMemo<
    ListUsersInput['sorting']
  >(() => {
    const serverDefaultSorting = definitions.sorting.defaultSorting;
    return serverDefaultSorting && serverDefaultSorting.length > 0
      ? serverDefaultSorting
      : [{ id: 'createdAt', desc: true }];
  }, [definitions]);

  const [page] = useQueryState('page', parseAsInteger.withDefault(1));
  const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const [query] = useQueryState('query', parseAsString.withDefault(''));
  const [status] = useQueryState(
    'status',
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [authMethods] = useQueryState(
    'authMethods',
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [roles] = useQueryState(
    'roles',
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [permissions] = useQueryState(
    'permissions',
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [sorting] = useQueryState(
    'sort',
    getSortingStateParser(sortableColumns).withDefault([])
  );

  const validateAdvancedFilters = (value: unknown) => {
    if (!Array.isArray(value)) return null;
    return value as Array<{
      id: string;
      value: unknown;
      variant: string;
      operator: string;
      filterId?: string;
    }>;
  };

  const [filters, setFilters] = useQueryState(
    'filters',
    parseAsJson(validateAdvancedFilters).withDefault([])
  );
  const [joinOperator] = useQueryState(
    'joinOperator',
    parseAsString.withDefault('and')
  );

  // Sync query, status, authMethods, roles, permissions into filters
  React.useEffect(() => {
    setFilters((prev) => {
      let updated = [...prev] as ListUsersInput['filters'];

      // Sync query
      if (!query) {
        updated = updated.filter((f) => f.id !== 'query');
      } else {
        const queryIndex = updated.findIndex((f) => f.id === 'query');
        if (queryIndex >= 0) {
          updated[queryIndex] = {
            ...updated[queryIndex],
            value: query,
          };
        } else {
          updated.push({
            id: 'query',
            value: query,
            variant: 'text',
            operator: 'iLike',
            filterId: generateId(),
          });
        }
      }

      // Sync status
      if (status.length === 0) {
        updated = updated.filter((f) => f.id !== 'status');
      } else {
        const statusIndex = updated.findIndex((f) => f.id === 'status');
        if (statusIndex >= 0) {
          updated[statusIndex] = {
            ...updated[statusIndex],
            value: status,
          };
        } else {
          updated.push({
            id: 'status',
            value: status,
            variant: 'multiSelect',
            operator: 'inArray',
            filterId: generateId(),
          });
        }
      }

      // Sync authMethods
      if (authMethods.length === 0) {
        updated = updated.filter((f) => f.id !== 'authMethods');
      } else {
        const authMethodsIndex = updated.findIndex(
          (f) => f.id === 'authMethods'
        );
        if (authMethodsIndex >= 0) {
          updated[authMethodsIndex] = {
            ...updated[authMethodsIndex],
            value: authMethods,
          };
        } else {
          updated.push({
            id: 'authMethods',
            value: authMethods,
            variant: 'multiSelect',
            operator: 'inArray',
            filterId: generateId(),
          });
        }
      }

      // Sync roles
      if (roles.length === 0) {
        updated = updated.filter((f) => f.id !== 'roles');
      } else {
        const rolesIndex = updated.findIndex((f) => f.id === 'roles');
        if (rolesIndex >= 0) {
          updated[rolesIndex] = {
            ...updated[rolesIndex],
            value: roles,
          };
        } else {
          updated.push({
            id: 'roles',
            value: roles,
            variant: 'multiSelect',
            operator: 'inArray',
            filterId: generateId(),
          });
        }
      }

      // Sync permissions
      if (permissions.length === 0) {
        updated = updated.filter((f) => f.id !== 'permissions');
      } else {
        const permissionsIndex = updated.findIndex(
          (f) => f.id === 'permissions'
        );
        if (permissionsIndex >= 0) {
          updated[permissionsIndex] = {
            ...updated[permissionsIndex],
            value: permissions,
          };
        } else {
          updated.push({
            id: 'permissions',
            value: permissions,
            variant: 'multiSelect',
            operator: 'inArray',
            filterId: generateId(),
          });
        }
      }

      return updated;
    });
  }, [query, status, authMethods, roles, permissions, setFilters]);

  const apiSorting = React.useMemo<ListUsersInput['sorting']>(() => {
    const mapped = sorting.flatMap((item) => {
      if (!sortableColumns.has(item.id)) {
        return [];
      }

      return [
        {
          id: item.id,
          desc: item.desc,
        },
      ];
    });

    return mapped.length > 0 ? mapped : defaultUsersListSorting;
  }, [defaultUsersListSorting, sortableColumns, sorting]);

  const listInput = React.useMemo<ListUsersInput>(
    () => ({
      filters: filters as ListUsersInput['filters'],
      pagination: {
        page,
        pageSize: perPage,
      },
      sorting: apiSorting,
      joinOperator: joinOperator === 'or' ? 'or' : 'and',
    }),
    [apiSorting, filters, joinOperator, page, perPage]
  );

  const { data, refetch, isLoading, isError, error, isRefetching } = useQuery(
    trpc.users.list.queryOptions(listInput)
  );

  const handleRefresh = async () => {
    await refetch();
    router.refresh();
  };

  if (isError) {
    return (
      <HTTPErrorAlert
        error={{
          ok: false,
          code: 'TRPC_ERROR',
          message: error.message,
          details: error.data ?? null,
          headers: {},
          statusCode: 500,
          statusText: 'Internal Server Error',
        }}
      />
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Users ({data?.pagination?.totalCount ?? 0})
      </h1>
      <UserDataTable
        auth={auth}
        data={data?.items || []}
        isLoading={isLoading}
        pageCount={data?.pagination?.pageCount ?? 1}
        onRefresh={handleRefresh}
        RefreshButton={() => (
          <Button
            onClick={handleRefresh}
            disabled={isRefetching}
            size="icon-sm"
            variant="outline"
          >
            <RefreshCwIcon className="shrink-0" />
          </Button>
        )}
      />
    </div>
  );
}
