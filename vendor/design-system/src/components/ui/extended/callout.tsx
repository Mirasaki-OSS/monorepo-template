import {
	Alert,
	AlertDescription,
	AlertTitle,
} from '@md-oss/design-system/components/ui/alert';
import { cn, mergePropsWithClassName } from '@md-oss/design-system/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import {
	AlertTriangleIcon,
	CheckCircle2Icon,
	InfoIcon,
	type LucideProps,
	XCircleIcon,
	XIcon,
} from 'lucide-react';

const calloutVariants = cva(
	'border text-sm [&>svg]:mt-0.5 [&>svg]:shrink-0 [&>svg]:self-start',
	{
		variants: {
			variant: {
				info: 'bg-blue-50 text-blue-900 border-blue-300 [&>svg]:text-blue-500 dark:bg-blue-900/10 dark:text-blue-50 dark:border-blue-700',
				success:
					'bg-green-50 text-green-900 border-green-300 [&>svg]:text-green-500 dark:bg-green-900/10 dark:text-green-50 dark:border-green-700',
				warning:
					'bg-yellow-50 text-yellow-900 border-yellow-300 [&>svg]:text-yellow-500 dark:bg-yellow-900/10 dark:text-yellow-50 dark:border-yellow-700',
				error:
					'bg-destructive/10 border-destructive dark:bg-destructive/30 dark:border-destructive',
			},
		},
		defaultVariants: {
			variant: 'info',
		},
	}
);

const iconMap = {
	info: InfoIcon,
	success: CheckCircle2Icon,
	warning: AlertTriangleIcon,
	error: XCircleIcon,
};

type CalloutProps = Omit<React.ComponentProps<typeof Alert>, 'variant'> &
	VariantProps<typeof calloutVariants> & {
		title?: string;
		classNames?: {
			title?: string;
			description?: string;
		};
		slotProps?: {
			title?: React.ComponentPropsWithoutRef<typeof AlertTitle>;
			description?: React.ComponentPropsWithoutRef<typeof AlertDescription>;
		};
		/**
		 * Renders a close button (X icon) in the top right corner of the callout.
		 */
		handleClose?: () => void;
		Icon?: React.ForwardRefExoticComponent<
			Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
		>;
	};

function Callout({
	className,
	title,
	variant = 'info',
	classNames,
	slotProps,
	handleClose,
	children,
	Icon: CustomIcon,
	...props
}: CalloutProps): React.JSX.Element {
	const Icon = CustomIcon || iconMap[variant || 'info'];

	return (
		<Alert
			variant={variant === 'error' ? 'destructive' : 'default'}
			className={cn(
				calloutVariants({ variant, className: 'relative' }),
				className
			)}
			{...props}
		>
			<Icon className="size-4" />
			{title && (
				<AlertTitle
					{...mergePropsWithClassName<
						React.ComponentPropsWithoutRef<typeof AlertTitle>
					>(
						{ className: 'font-semibold mb-1' },
						slotProps?.title,
						classNames?.title
					)}
				>
					{title}
				</AlertTitle>
			)}
			<AlertDescription
				{...mergePropsWithClassName<
					React.ComponentPropsWithoutRef<typeof AlertDescription>
				>({}, slotProps?.description, classNames?.description)}
			>
				{children}
			</AlertDescription>
			{handleClose && (
				<XIcon
					className="absolute right-2 top-2 h-4 w-4 cursor-pointer"
					onClick={handleClose}
				/>
			)}
		</Alert>
	);
}

export { Callout, calloutVariants };
