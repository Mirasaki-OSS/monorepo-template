import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@md-oss/design-system/components/ui/card';
import {
	mergePropsWithClassName,
	resolveSlot,
	type WithAsComponent,
} from '@md-oss/design-system/lib/utils';
import { ShieldAlertIcon } from 'lucide-react';
import React from 'react';

export type AccessDeniedIconProps = {
	className?: string;
	classNames?: {
		background?: string;
		icon?: string;
	};
	slotProps?: {
		container?: React.HTMLAttributes<HTMLDivElement>;
		background?: React.HTMLAttributes<HTMLDivElement>;
		icon?: WithAsComponent<
			React.ComponentPropsWithoutRef<typeof ShieldAlertIcon>
		>;
	};
};

export function AccessDeniedIcon(props: AccessDeniedIconProps) {
	const [IconEl, iconSlotProps] = resolveSlot(
		ShieldAlertIcon,
		props.slotProps?.icon
	);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: 'flex justify-center mb-2',
		},
		props.slotProps?.container,
		props.className
	);

	const backgroundProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			className: 'rounded-full bg-destructive/10 p-2',
		},
		props.slotProps?.background,
		props.classNames?.background
	);

	const iconProps = mergePropsWithClassName<
		React.ComponentPropsWithoutRef<typeof ShieldAlertIcon>
	>(
		{
			className: 'h-6 w-6 text-destructive',
		},
		iconSlotProps,
		props.classNames?.icon
	);

	return (
		<div {...containerProps}>
			<div {...backgroundProps}>
				<IconEl {...iconProps} />
			</div>
		</div>
	);
}

export type AccessDeniedProps = {
	variant?: 'default' | 'card';
	title?: React.ReactNode;
	description?: React.ReactNode;
	hideIcon?: boolean;
	className?: string;
	classNames?: {
		icon?: string;
		title?: string;
		description?: string;
	};
	slotProps?: {
		container?: WithAsComponent<React.HTMLAttributes<HTMLDivElement>>;
		icon?: AccessDeniedIconProps;
		title?: WithAsComponent<React.HTMLAttributes<HTMLHeadingElement>>;
		description?: WithAsComponent<React.HTMLAttributes<HTMLParagraphElement>>;
	};
	children?: React.ReactNode;
};

export function AccessDenied({
	variant = 'default',
	title = 'Access Denied',
	description = 'You do not have permission to access this content.',
	className,
	classNames,
	slotProps,
	hideIcon,
	children,
}: AccessDeniedProps) {
	const titleFallbackId = React.useId();
	const titleId = slotProps?.title?.id || titleFallbackId;

	const [ContainerEl, containerSlotProps] = resolveSlot(
		variant === 'card' ? Card : 'div',
		slotProps?.container
	);
	const [TitleEl, titleSlotProps] = resolveSlot(
		variant === 'card' ? CardTitle : 'h1',
		slotProps?.title
	);
	const [DescriptionEl, descriptionSlotProps] = resolveSlot(
		variant === 'card' ? CardDescription : 'p',
		slotProps?.description
	);

	const containerProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLDivElement>
	>(
		{
			role: 'region',
			'aria-labelledby': titleId,
			className:
				variant === 'card'
					? 'w-full'
					: 'flex h-full flex-col items-center justify-center gap-4',
		},
		containerSlotProps,
		className
	);

	const titleProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLHeadingElement>
	>(
		{
			id: titleId,
			className: variant === 'card' ? 'text-center' : 'text-2xl font-bold',
		},
		titleSlotProps,
		classNames?.title
	);

	const descriptionProps = mergePropsWithClassName<
		React.HTMLAttributes<HTMLParagraphElement>
	>(
		{
			className: variant === 'card' ? 'text-center' : 'text-muted-foreground',
		},
		descriptionSlotProps,
		classNames?.description
	);

	const iconProps = mergePropsWithClassName<AccessDeniedIconProps>(
		{},
		slotProps?.icon,
		classNames?.icon
	);

	const WithCardHeader = variant === 'card' ? CardHeader : React.Fragment;
	const WithCardContent =
		variant === 'card' && children ? CardContent : React.Fragment;

	return (
		<ContainerEl {...containerProps}>
			<WithCardHeader>
				{!hideIcon && <AccessDeniedIcon {...iconProps} />}
				<TitleEl {...titleProps}>{title}</TitleEl>
				<DescriptionEl {...descriptionProps}>{description}</DescriptionEl>
			</WithCardHeader>
			<WithCardContent>{children}</WithCardContent>
		</ContainerEl>
	);
}
