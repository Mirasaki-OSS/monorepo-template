'use client';

import { ThemeSwitcher } from '@md-oss/design-system/components/theme/switcher';
import { ThemeToggle } from '@md-oss/design-system/components/theme/toggle';
import { Button } from '@md-oss/design-system/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@md-oss/design-system/components/ui/drawer';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function HomePageClient() {
  const router = useRouter();
  const [refetchCount, setRefetchCount] = React.useState(0);

  // const trpc = useTRPC();
  // const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  // 	const [showSignIn, setShowSignIn] = useState(false);

  // return showSignIn ? (
  // 	<SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  // ) : (
  // 	<SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  // );

  const healthCheck = {
    data: { status: 'ok', timestamp: new Date().toISOString() },
    refetch: () => {
      router.refresh();
      setRefetchCount((prev) => prev + 1);
    },
  };

  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-2xl font-bold mb-4">Hello World</h1>
      <p>
        You can open{' '}
        <Link href="/docs" className="font-medium underline">
          /docs
        </Link>{' '}
        and see the documentation.
      </p>
      <div className="flex items-center justify-center gap-2 mt-2">
        <ThemeToggle />
        <ThemeSwitcher />
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>API Health Check</DrawerTitle>
              <DrawerDescription>
                This is the result of a health check query to the API.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <DynamicCodeBlock
                lang="json"
                codeblock={{
                  title: `Health Check Result (Refetch count: ${refetchCount})`,
                  allowCopy: true,
                  keepBackground: false,
                }}
                code={JSON.stringify(healthCheck.data, null, 2)}
              />
            </div>
            <DrawerFooter>
              <Button variant="outline" onClick={() => healthCheck.refetch()}>
                Refresh
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
