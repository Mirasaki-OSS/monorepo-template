'use client';

import { ThemeClientOnly } from '@md-oss/design-system/components/theme/client-only';
import {
	nextTheme,
	ThemeIcon,
	themeLabel,
} from '@md-oss/design-system/components/theme/registry';
import {
	Button,
	buttonVariants,
} from '@md-oss/design-system/components/ui/button';
import { Skeleton } from '@md-oss/design-system/components/ui/skeleton';
import { cn } from '@md-oss/design-system/lib/utils';

export function ThemeToggleSkeleton({
	className,
	...props
}: React.ComponentProps<typeof Skeleton>) {
	return (
		<Skeleton
			aria-disabled="true"
			aria-label="Loading theme toggle"
			aria-hidden="true"
			className={cn(
				buttonVariants({ variant: 'outline', size: 'icon' }),
				'animate-none',
				className
			)}
			{...props}
		>
			<ThemeIcon theme={'system'} className="h-[1.2rem] w-[1.2rem]" />
		</Skeleton>
	);
}

export function ThemeToggle({
	className,
	...props
}: React.ComponentProps<typeof Button>) {
	return (
		<ThemeClientOnly fallback={<ThemeToggleSkeleton className={className} />}>
			{({ setTheme, resolvedTheme }) => {
				const next = nextTheme(resolvedTheme, false, 'dark');
				const current = resolvedTheme ?? 'system';

				return (
					<Button
						variant="outline"
						size="icon"
						aria-label={themeLabel(resolvedTheme)}
						onClick={() => setTheme(next)}
						className={className}
						{...props}
					>
						<ThemeIcon theme={current} className="h-[1.2rem] w-[1.2rem]" />
					</Button>
				);
			}}
		</ThemeClientOnly>
	);
}
