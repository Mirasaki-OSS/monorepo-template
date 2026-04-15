'use client';

import { isTypingTarget } from '@md-oss/design-system/lib/typing';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import * as React from 'react';

function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	// [Bug]: Script tag while rendering React component
	// [Source]: https://github.com/pacocoursey/next-themes/issues/387#issuecomment-4181891723
	const scriptProps =
		typeof window === 'undefined'
			? undefined
			: ({ type: 'application/json' } as const);

	return (
		<NextThemesProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange
			scriptProps={scriptProps}
			{...props}
		>
			<ThemeHotkey />
			{children}
		</NextThemesProvider>
	);
}

function ThemeHotkey() {
	const { resolvedTheme, setTheme } = useTheme();

	React.useEffect(() => {
		function onKeyDown(event: KeyboardEvent) {
			if (event.defaultPrevented || event.repeat) {
				return;
			}

			if (event.metaKey || event.ctrlKey || event.altKey) {
				return;
			}

			if (event.key.toLowerCase() !== 'd') {
				return;
			}

			if (isTypingTarget(event.target)) {
				return;
			}

			setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
		}

		window.addEventListener('keydown', onKeyDown);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
		};
	}, [resolvedTheme, setTheme]);

	return null;
}

export { ThemeHotkey, ThemeProvider };
