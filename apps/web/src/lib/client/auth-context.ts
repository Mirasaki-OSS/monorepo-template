import type { ClientAuthContext, ServerAuthContext } from '@md-oss/api/types';

export const transformToClientAuthContext = (
  data: ServerAuthContext
): ClientAuthContext => {
  const { ability, ...rest } = data;
  return {
    ...rest,
    ability: undefined as never,
  };
};
