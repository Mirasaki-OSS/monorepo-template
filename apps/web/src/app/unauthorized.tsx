import { AccessDenied } from '@md-oss/design-system/components/sections/access-denied';
import { AppUserButton } from '@/components/user-button';

// Note: unauthorized.tsx is an experimental feature: https://nextjs.org/docs/app/api-reference/file-conventions/unauthorized

export default function Unauthorized() {
  return (
    <AccessDenied
      title="Unauthorized"
      description="Please log in to access this resource."
      variant="default"
    >
      <AppUserButton variant="outline" size="default" />
    </AccessDenied>
  );
}
