import { UserButton } from '@md-oss/design-system/components/auth/user/user-button';
import { AccessDenied } from '@md-oss/design-system/components/sections/access-denied';

// Note: unauthorized.tsx is an experimental feature: https://nextjs.org/docs/app/api-reference/file-conventions/unauthorized

export default function Unauthorized() {
  return (
    <AccessDenied
      title="Unauthorized"
      description="Please log in to access this resource."
      variant="default"
    >
      <UserButton variant="outline" size="default" />
    </AccessDenied>
  );
}
