import type { JSX, ReactNode } from 'react';
import { env } from './env';
import { GoogleAnalytics } from './google';
import { VercelAnalytics } from './vercel';

type AnalyticsProviderProps = {
	readonly children: ReactNode;
};

const { NEXT_PUBLIC_GA_MEASUREMENT_ID } = env();

export const AnalyticsProvider = ({
	children,
}: AnalyticsProviderProps): JSX.Element => (
	<>
		{children}
		<VercelAnalytics />
		{NEXT_PUBLIC_GA_MEASUREMENT_ID && (
			<GoogleAnalytics gaId={NEXT_PUBLIC_GA_MEASUREMENT_ID} />
		)}
	</>
);
