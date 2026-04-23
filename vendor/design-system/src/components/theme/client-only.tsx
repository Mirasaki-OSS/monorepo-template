'use client';

import { ClientOnly } from '@md-oss/design-system/components/client-only';
import { useTheme } from 'next-themes';
import type * as React from 'react';

type ThemeClientOnlyRenderProps = ReturnType<typeof useTheme>;

type ThemeClientOnlyProps = {
	children: (props: ThemeClientOnlyRenderProps) => React.ReactNode;
	fallback: React.ReactNode;
};

function ThemeClientOnly({ children, fallback }: ThemeClientOnlyProps) {
	const theme = useTheme();

	return <ClientOnly fallback={fallback}>{children(theme)}</ClientOnly>;
}

export {
	ThemeClientOnly,
	type ThemeClientOnlyProps,
	type ThemeClientOnlyRenderProps,
};
