'use client';

import { HTTPErrorAlert } from '@md-oss/design-system/components/state/http-error-alert';
import { Loader } from '@md-oss/design-system/components/state/loader';
import { Button } from '@md-oss/design-system/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTRPC } from '@/lib/client/trpc';

export default function AdminPageClient() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data, refetch, isLoading, isError, error, isRefetching } = useQuery(
    trpc.hello.queryOptions({ text: 'from the client!' })
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Admin Page</h1>
      <p className="mb-4">Data from TRPC: {data?.greeting}</p>
      <Button
        onClick={handleRefresh}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={isRefetching}
      >
        {isRefetching ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  );
}
