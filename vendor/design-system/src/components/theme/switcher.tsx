'use client';

import { ThemeClientOnly } from '@md-oss/design-system/components/theme/client-only';
import { ThemeIcon } from '@md-oss/design-system/components/theme/registry';
import {
	Button,
	buttonVariants,
} from '@md-oss/design-system/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@md-oss/design-system/components/ui/dropdown-menu';
import { Skeleton } from '@md-oss/design-system/components/ui/skeleton';
import { cn } from '@md-oss/design-system/lib/utils';

export type ThemeSwitcherTriggerContentProps = {
	theme: string;
	iconProps?: React.ComponentProps<typeof ThemeIcon>;
};

export function ThemeSwitcherTriggerContent({
	theme,
	iconProps,
}: ThemeSwitcherTriggerContentProps) {
	const { className: iconPropsClassName, ...restIconProps } = iconProps ?? {};
	return (
		<>
			<ThemeIcon
				theme={theme}
				className={cn('h-[1.2rem] w-[1.2rem]', iconPropsClassName)}
				{...restIconProps}
			/>
			<span className="sr-only">Change theme</span>
		</>
	);
}

export type ThemeSwitcherTriggerProps = React.ComponentProps<typeof Button> &
	ThemeSwitcherTriggerContentProps;

export function ThemeSwitcherTrigger({
	theme,
	iconProps,
	...props
}: ThemeSwitcherTriggerProps) {
	return (
		<Button variant="outline" size="icon" aria-label="Change theme" {...props}>
			<ThemeSwitcherTriggerContent theme={theme} iconProps={iconProps} />
		</Button>
	);
}

export type ThemeSwitcherSkeletonProps = React.ComponentProps<
	typeof Skeleton
> & {
	iconProps?: React.ComponentProps<typeof ThemeIcon>;
};

export function ThemeSwitcherSkeleton({
	className,
	iconProps,
	...props
}: ThemeSwitcherSkeletonProps) {
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
			<ThemeSwitcherTriggerContent theme={'system'} iconProps={iconProps} />
		</Skeleton>
	);
}

export type ThemeSwitcherProps = React.ComponentProps<typeof Button>;

export function ThemeSwitcher({ className, ...props }: ThemeSwitcherProps) {
	return (
		<ThemeClientOnly fallback={<ThemeSwitcherSkeleton className={className} />}>
			{({ setTheme, theme, resolvedTheme }) => (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<ThemeSwitcherTrigger
							className={className}
							theme={theme ?? resolvedTheme ?? 'system'}
							{...props}
						/>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => setTheme('light')}>
							Light
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme('dark')}>
							Dark
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme('system')}>
							System
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}
		</ThemeClientOnly>
	);
}
