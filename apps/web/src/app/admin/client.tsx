'use client';

import type { ListUsersInput } from '@md-oss/api/types';
import { HTTPErrorAlert } from '@md-oss/design-system/components/state/http-error-alert';
import { Loader } from '@md-oss/design-system/components/state/loader';
import {
  CodeBlock,
  registerCodeBlockLanguage,
} from '@md-oss/design-system/components/ui/aceternity/code-block';
import { Button } from '@md-oss/design-system/components/ui/button';
import { generateId } from '@md-oss/design-system/lib/id';
import { getSortingStateParser } from '@md-oss/design-system/lib/parsers';
import { useQuery } from '@tanstack/react-query';
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
import { MyDataTable } from './components/data-table';

registerCodeBlockLanguage('json', json);

const userListSortableColumns = new Set([
  'query',
  'email',
  'id',
  'status',
  'authMethods',
  'createdAt',
]);

const defaultUsersListSorting: ListUsersInput['sorting'] = [
  { id: 'createdAt', desc: true },
];

const usersApiSortIdByTableSortId: Record<
  string,
  ListUsersInput['sorting'][number]['id']
> = {
  query: 'query',
  email: 'email',
  id: 'id',
  status: 'status',
  authMethods: 'authMethods',
  createdAt: 'createdAt',
};

export default function AdminPageClient() {
  const trpc = useTRPC();
  const router = useRouter();
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
  const [sorting] = useQueryState(
    'sort',
    getSortingStateParser(userListSortableColumns).withDefault([])
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

  // Sync query, status, authMethods into filters
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

      return updated;
    });
  }, [query, status, authMethods, setFilters]);

  const apiSorting = React.useMemo<ListUsersInput['sorting']>(() => {
    const mapped = sorting.flatMap((item) => {
      const mappedId = usersApiSortIdByTableSortId[item.id];
      if (!mappedId) {
        return [];
      }

      return [{ id: mappedId, desc: item.desc }];
    });

    return mapped.length > 0 ? mapped : defaultUsersListSorting;
  }, [sorting]);

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

  if (isLoading) {
    return <Loader />;
  }

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

  const DebugView = () => {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    return (
      <div className="mt-4 p-4 rounded">
        <h2 className="text-lg font-bold mb-2">Debug Info</h2>
        <CodeBlock
          language="json"
          className="mb-4"
          showLineNumbers
          code={JSON.stringify({ isLoading, isError, error, data }, null, 2)}
          title={
            <p className="flex items-center gap-1">
              <span className="size-2.5 bg-orange-400 rounded-full inline-flex" />
              JSON Details
            </p>
          }
          slotProps={{
            root: {
              className: 'max-h-[20rem] overflow-y-auto',
            },
          }}
        />
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Page</h1>
      <MyDataTable
        data={data?.items || []}
        pageCount={data?.pagination?.pageCount ?? 1}
      />
      <Button
        onClick={handleRefresh}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={isRefetching}
      >
        {isRefetching ? 'Refreshing...' : 'Refresh'}
      </Button>
      <DebugView />
    </div>
  );
}
