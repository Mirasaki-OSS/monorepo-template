import type { ServerAuthContext } from '@md-oss/api/context';
import { type AuthzAccessArea, canAccessArea } from '@md-oss/authz';
import { forbidden, unauthorized } from 'next/navigation';

export function requireAccessArea(
  session: ServerAuthContext | null,
  area: AuthzAccessArea
): asserts session is ServerAuthContext {
  if (!session) {
    unauthorized();
  }

  if (!canAccessArea(session.actor.roles, area)) {
    forbidden();
  }
}
