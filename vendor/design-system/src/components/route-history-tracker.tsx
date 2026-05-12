'use client';

import { pushRoute } from '@md-oss/design-system/lib/route-history';
import { useEffect } from 'react';

export type RouteHistoryTrackerProps = {
	pathname: string;
};

export function RouteHistoryTracker({ pathname }: RouteHistoryTrackerProps) {
	useEffect(() => {
		if (pathname) {
			pushRoute(pathname);
		}
	}, [pathname]);

	return null;
}
