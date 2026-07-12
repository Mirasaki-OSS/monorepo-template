'use server';

import { pickAllowedRequestHeaders } from '@md-oss/common';
import { headers } from 'next/headers';
import { createTrpc } from '../trpc';

export const serverTrpc = async (
  _headers?: Awaited<ReturnType<typeof headers>>
) => {
  const requestHeaders = _headers || (await headers());

  return createTrpc({
    cache: 'no-store',
    credentials: 'include',
    headers: pickAllowedRequestHeaders(requestHeaders, ['cookie']),
  });
};
