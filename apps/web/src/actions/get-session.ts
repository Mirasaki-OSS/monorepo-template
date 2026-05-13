'use server';

import type { AuthContext } from '@md-oss/api/context';
import { buildAbilityForActor } from '@md-oss/authz';
import {
  createHTTPError,
  isHTTPErrorResponse,
  pickAllowedRequestHeaders,
  statusCodes,
} from '@md-oss/common/http';
import { withActionResult } from '@md-oss/design-system/lib/action-result';
import { headers } from 'next/headers';
import { authClient } from '@/lib/client/auth';

type GetSessionOptions = Exclude<
  NonNullable<Parameters<typeof authClient.getSession>[0]>['query'],
  undefined
>;

export const getSession = async (options: GetSessionOptions = {}) =>
  await withActionResult<AuthContext | null>(
    async () => {
      const requestHeaders = await headers();

      const { data, error } = await authClient.getSession({
        query: {
          disableCookieCache: false,
          disableRefresh: false,
          ...options,
        },
        fetchOptions: {
          throw: false,
          headers: pickAllowedRequestHeaders(requestHeaders, ['cookie']),
          timeout: 2500,
        },
      });

      if (isHTTPErrorResponse(error)) {
        return error;
      }

      if (!data) {
        return null;
      }

      return {
        ...data,
        ability: buildAbilityForActor(data.actor),
      };
    },
    {
      code: 'GET_SESSION_ERROR',
      message: 'Unable to get session',
    }
  );

export const getRequiredSession = async (options: GetSessionOptions = {}) =>
  await withActionResult<AuthContext>(
    async () => {
      const sessionResponse = await getSession(options);

      if (!sessionResponse.ok) {
        return sessionResponse.error;
      }

      if (sessionResponse.data === null) {
        return createHTTPError({
          code: 'NO_ACTIVE_SESSION',
          message: 'No active session',
          statusCode: statusCodes.UNAUTHORIZED,
          details: null,
        });
      }

      return sessionResponse.data;
    },
    {
      code: 'GET_REQUIRED_SESSION_ERROR',
      message: 'Unable to get required session',
    }
  );
