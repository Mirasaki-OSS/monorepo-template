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

export function ThemeToggleSkeleton(
	props: React.ComponentProps<typeof Skeleton>
) {
	return (
		<Skeleton
			aria-hidden="true"
			className={cn(
				'size-9 shrink-0 rounded-md',
				buttonVariants({ variant: 'outline', size: 'icon' }),
				props.className
			)}
			{...props}
		/>
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
