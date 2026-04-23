'use client';

import * as React from 'react';

function ClientOnly({
	children,
	fallback = null,
}: {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <React.Fragment>{fallback}</React.Fragment>;
	}

	return <React.Fragment>{children}</React.Fragment>;
}

export { ClientOnly };
