'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // [DEV] Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <title>Error</title>
        <h2>Something went wrong</h2>
        <button type="button" onClick={() => unstable_retry()}>
          Try again
        </button>
      </body>
    </html>
  );
}
