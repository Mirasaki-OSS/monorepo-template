# @md-oss/analytics

Thin helpers to wire analytics in Next.js apps: Vercel Analytics by default, Google Analytics when a measurement ID is present. Includes a typed env loader for `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

## Features
- Drop-in `AnalyticsProvider` that renders Vercel Analytics and conditionally Google Analytics
- Typed env helper using `@t3-oss/env-nextjs` with Zod validation for GA measurement IDs
- Direct re-exports of `GoogleAnalytics` (Next.js third-parties) and `VercelAnalytics` for custom composition

## Installation

```bash
pnpm add @md-oss/analytics
```

## Usage

Wrap your Next.js root layout or app with the provider:

```tsx
// app/layout.tsx
import { AnalyticsProvider } from '@md-oss/analytics/provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body>
				<AnalyticsProvider>{children}</AnalyticsProvider>
			</body>
		</html>
	);
}
```

Add your GA ID (optional) to the environment:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Validate env in Next.js:

```ts
// app/env.ts
import { env } from '@md-oss/analytics/env';

export const { NEXT_PUBLIC_GA_MEASUREMENT_ID } = env();
```

If `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, the provider renders `GoogleAnalytics` with that ID. Vercel Analytics is always enabled via `@vercel/analytics/react`.

## Exports
- `env` — validated client env loader for GA measurement ID
- `AnalyticsProvider` — combines Vercel + conditional GA
- `GoogleAnalytics` — re-export from `@next/third-parties/google`
- `VercelAnalytics` — re-export from `@vercel/analytics/react`
