import { AccessDenied } from '@md-oss/design-system/components/sections/access-denied';
import { buttonVariants } from '@md-oss/design-system/components/ui/button';
import { cn } from '@md-oss/design-system/lib/utils';
import Link from 'next/link';

// Note: forbidden.tsx is an experimental feature: https://nextjs.org/docs/app/api-reference/file-conventions/forbidden

export default function Forbidden() {
  return (
    <AccessDenied
      title="Access Denied"
      description="You are not authorized to access this resource."
      variant="default"
    >
      <Link
        href="/"
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
      >
        Go Home
      </Link>
    </AccessDenied>
  );
}
